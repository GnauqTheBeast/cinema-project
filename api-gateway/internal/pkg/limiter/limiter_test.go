package limiter

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

func TestRedisLimiter(t *testing.T) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       15, // use a test DB
	})

	defer func() {
		rdb.FlushDB(context.Background())
		rdb.Close()
	}()

	// Test if Redis is available
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		t.Skip("Redis not available, skipping test")
	}

	// Create limiter
	limiter, err := NewRedisLimiter(rdb)
	if err != nil {
		t.Fatalf("Failed to create Redis limiter: %v", err)
	}

	// Define rate limit
	limit := Limit{
		Rate:   20,
		Burst:  10,
		Period: time.Minute,
	}

	key := "test:user:123"

	// Test normal operation
	result, err := limiter.Allow(ctx, key, limit)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if result == nil {
		t.Fatal("Expected result, got nil")
	}

	if result.Allowed <= 0 {
		t.Errorf("Expected allowed > 0, got: %d", result.Allowed)
	}

	if result.Remaining >= limit.Rate {
		t.Errorf("Expected remaining < rate, got remaining=%d, rate=%d", result.Remaining, limit.Rate)
	}

	skipCtx := Skip(ctx)
	skipResult, err := limiter.Allow(skipCtx, key, limit)
	if err != nil {
		t.Fatalf("Expected no error with skip context, got: %v", err)
	}

	if skipResult != nil {
		t.Error("Expected nil result with skip context")
	}

	// Test rate limiting
	// Make enough requests to exceed the rate limit
	for i := 0; i < limit.Rate+1; i++ {
		limiter.Allow(ctx, key, limit)
	}

	// This should now be rate limited
	result, err = limiter.Allow(ctx, key, limit)
	if !errors.Is(err, ErrRateLimited) {
		t.Errorf("Expected ErrRateLimited, got: %v", err)
	}

	if result == nil {
		t.Error("Expected result even when rate limited")
		return
	}

	if result.Remaining != 0 {
		t.Errorf("Expected remaining=0 when rate limited, got: %d", result.Remaining)
	}
}
