package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"api-gateway/internal/config"
	"api-gateway/pkg/logger"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"golang.org/x/time/rate"
)

type RateLimiter struct {
	config      *config.Config
	redisClient *redis.Client
	logger      logger.Logger
	limiter     *rate.Limiter // In-memory fallback
}

func NewRateLimiter(cfg *config.Config, redisClient *redis.Client, log logger.Logger) *RateLimiter {
	// Create in-memory rate limiter as fallback
	limiter := rate.NewLimiter(
		rate.Limit(cfg.RateLimit.RequestsPerSecond),
		cfg.RateLimit.BurstSize,
	)

	return &RateLimiter{
		config:      cfg,
		redisClient: redisClient,
		logger:      log,
		limiter:     limiter,
	}
}

func (rl *RateLimiter) Limit() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Get client identifier (IP or user ID if authenticated)
		clientID := rl.getClientID(c)

		// Try Redis-based rate limiting first
		if rl.redisClient != nil {
			allowed, remaining, resetTime, err := rl.checkRedisRateLimit(c, clientID)
			if err != nil {
				rl.logger.Warn("Redis rate limiting failed, falling back to in-memory",
					"client_id", clientID,
					"error", err)
				// Fall back to in-memory rate limiting
				if !rl.limiter.Allow() {
					rl.handleRateLimitExceeded(c, 0, time.Now().Add(time.Second))
					return
				}
			} else {
				// Set rate limit headers
				c.Header("X-RateLimit-Limit", strconv.Itoa(rl.config.RateLimit.RequestsPerSecond))
				c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
				c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime.Unix(), 10))

				if !allowed {
					rl.handleRateLimitExceeded(c, remaining, resetTime)
					return
				}
			}
		} else {
			// Use in-memory rate limiting
			if !rl.limiter.Allow() {
				rl.handleRateLimitExceeded(c, 0, time.Now().Add(time.Second))
				return
			}
		}

		rl.logger.Debug("Rate limit check passed",
			"client_id", clientID,
			"path", c.Request.URL.Path)

		c.Next()
	})
}

func (rl *RateLimiter) getClientID(c *gin.Context) string {
	// Use user ID if authenticated, otherwise use IP address
	if userID, exists := c.Get("user_id"); exists {
		return fmt.Sprintf("user:%s", userID)
	}

	// Get real IP address considering proxy headers
	ip := c.ClientIP()
	return fmt.Sprintf("ip:%s", ip)
}

func (rl *RateLimiter) checkRedisRateLimit(c *gin.Context, clientID string) (allowed bool, remaining int, resetTime time.Time, err error) {
	ctx := c.Request.Context()
	window := time.Duration(rl.config.RateLimit.WindowSize) * time.Second
	limit := rl.config.RateLimit.RequestsPerSecond

	now := time.Now()
	windowStart := now.Truncate(window)
	key := fmt.Sprintf("rate_limit:%s:%d", clientID, windowStart.Unix())

	// Use Redis pipeline for atomic operations
	pipe := rl.redisClient.Pipeline()

	// Increment counter
	incrCmd := pipe.Incr(ctx, key)

	// Set expiration if this is the first request in the window
	pipe.Expire(ctx, key, window)

	// Execute pipeline
	_, err = pipe.Exec(ctx)
	if err != nil {
		return false, 0, time.Time{}, err
	}

	// Get current count
	current, err := incrCmd.Result()
	if err != nil {
		return false, 0, time.Time{}, err
	}

	// Calculate remaining requests and reset time
	remaining = limit - int(current)
	if remaining < 0 {
		remaining = 0
	}

	resetTime = windowStart.Add(window)
	allowed = current <= int64(limit)

	rl.logger.Debug("Redis rate limit check",
		"client_id", clientID,
		"current", current,
		"limit", limit,
		"remaining", remaining,
		"allowed", allowed)

	return allowed, remaining, resetTime, nil
}

func (rl *RateLimiter) handleRateLimitExceeded(c *gin.Context, remaining int, resetTime time.Time) {
	rl.logger.Warn("Rate limit exceeded",
		"client_id", rl.getClientID(c),
		"path", c.Request.URL.Path,
		"method", c.Request.Method,
		"remaining", remaining)

	c.Header("X-RateLimit-Limit", strconv.Itoa(rl.config.RateLimit.RequestsPerSecond))
	c.Header("X-RateLimit-Remaining", "0")
	c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime.Unix(), 10))
	c.Header("Retry-After", strconv.FormatInt(int64(time.Until(resetTime).Seconds()), 10))

	c.JSON(http.StatusTooManyRequests, gin.H{
		"error":       "Rate limit exceeded",
		"code":        "RATE_LIMIT_EXCEEDED",
		"message":     "Too many requests. Please try again later.",
		"retry_after": time.Until(resetTime).Seconds(),
	})

	c.Abort()
}

// Optional: Method to check rate limit without incrementing (for preflight checks)
func (rl *RateLimiter) CheckRateLimit(clientID string) (allowed bool, remaining int, resetTime time.Time) {
	if rl.redisClient == nil {
		// For in-memory limiter, we can't check without consuming
		return rl.limiter.Allow(), 0, time.Now().Add(time.Second)
	}

	ctx := context.Background()
	window := time.Duration(rl.config.RateLimit.WindowSize) * time.Second
	limit := rl.config.RateLimit.RequestsPerSecond

	now := time.Now()
	windowStart := now.Truncate(window)
	key := fmt.Sprintf("rate_limit:%s:%d", clientID, windowStart.Unix())

	// Get current count without incrementing
	current, err := rl.redisClient.Get(ctx, key).Int()
	if err != nil && err != redis.Nil {
		return false, 0, time.Now()
	}

	remaining = limit - current
	if remaining < 0 {
		remaining = 0
	}

	resetTime = windowStart.Add(window)
	allowed = current < limit

	return allowed, remaining, resetTime
}
