package proxy

import (
	"bytes"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"api-gateway/internal/config"
	"api-gateway/internal/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/go-resty/resty/v2"
)

type Proxy struct {
	config *config.Config
	client *resty.Client
	logger logger.Logger
}

type ServiceProxy struct {
	Name     string
	Endpoint config.ServiceEndpoint
	Client   *resty.Client
}

func NewProxy(cfg *config.Config, log logger.Logger) *Proxy {
	client := resty.New()
	client.SetTimeout(time.Duration(30) * time.Second)
	client.SetRetryCount(3)
	client.SetRetryWaitTime(1 * time.Second)

	return &Proxy{
		config: cfg,
		client: client,
		logger: log,
	}
}

func (p *Proxy) createServiceProxy(name string, endpoint config.ServiceEndpoint) *ServiceProxy {
	client := resty.New()
	client.SetBaseURL(endpoint.URL)
	client.SetTimeout(time.Duration(endpoint.Timeout) * time.Second)
	client.SetRetryCount(endpoint.Retries)

	return &ServiceProxy{
		Name:     name,
		Endpoint: endpoint,
		Client:   client,
	}
}

// ProxyRequest handles the main proxy logic
func (p *Proxy) ProxyRequest(c *gin.Context) {
	path := c.Request.URL.Path
	method := c.Request.Method

	// Determine target service based on path
	service, targetPath := p.getTargetService(path)
	if service == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Service not found",
			"path":  path,
		})
		return
	}

	// Create service proxy
	proxy := p.createServiceProxy(service.Name, service.Endpoint)

	// Prepare request
	req := proxy.Client.R()

	// Copy headers (excluding certain headers)
	for key, values := range c.Request.Header {
		if p.shouldForwardHeader(key) {
			for _, value := range values {
				req.SetHeader(key, value)
			}
		}
	}

	// Copy query parameters
	req.SetQueryParamsFromValues(c.Request.URL.Query())

	// Copy request body if present
	if c.Request.Body != nil {
		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			p.logger.Error("Failed to read request body", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read request body"})
			return
		}
		c.Request.Body = io.NopCloser(bytes.NewReader(bodyBytes))
		req.SetBody(bodyBytes)
	}

	// Execute request
	var resp *resty.Response
	var err error

	switch method {
	case "GET":
		resp, err = req.Get(targetPath)
	case "POST":
		resp, err = req.Post(targetPath)
	case "PUT":
		resp, err = req.Put(targetPath)
	case "DELETE":
		resp, err = req.Delete(targetPath)
	case "PATCH":
		resp, err = req.Patch(targetPath)
	default:
		c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Method not allowed"})
		return
	}

	if err != nil {
		p.logger.Error("Proxy request failed",
			"service", service.Name,
			"path", targetPath,
			"error", err)

		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "Service unavailable",
			"service": service.Name,
		})
		return
	}

	// Copy response headers
	for key, values := range resp.Header() {
		if p.shouldForwardResponseHeader(key) {
			for _, value := range values {
				c.Header(key, value)
			}
		}
	}

	// Set response
	c.Data(resp.StatusCode(), resp.Header().Get("Content-Type"), resp.Body())

	// Log the request
	p.logger.Info("Request proxied",
		"method", method,
		"path", path,
		"target_path", targetPath,
		"service", service.Name,
		"status", resp.StatusCode(),
		"response_time", resp.Time())
}

type ServiceInfo struct {
	Name     string
	Endpoint config.ServiceEndpoint
}

func (p *Proxy) getTargetService(path string) (*ServiceInfo, string) {
	switch {
	case strings.HasPrefix(path, "/api/auth"):
		return &ServiceInfo{
			Name:     "auth-service",
			Endpoint: p.config.Services.AuthService,
		}, path

	case strings.HasPrefix(path, "/api/movies"),
		strings.HasPrefix(path, "/api/rooms"),
		strings.HasPrefix(path, "/api/seats"),
		strings.HasPrefix(path, "/api/showtimes"):
		return &ServiceInfo{
			Name:     "movie-service",
			Endpoint: p.config.Services.MovieService,
		}, path

	case strings.HasPrefix(path, "/api/notifications"),
		strings.HasPrefix(path, "/ws"):
		return &ServiceInfo{
			Name:     "notification-service",
			Endpoint: p.config.Services.NotificationService,
		}, path

	default:
		return nil, ""
	}
}

func (p *Proxy) shouldForwardHeader(header string) bool {
	// Headers that should not be forwarded
	excludeHeaders := map[string]bool{
		"host":                true,
		"content-length":      true,
		"transfer-encoding":   true,
		"connection":          true,
		"upgrade":             true,
		"proxy-connection":    true,
		"proxy-authenticate":  true,
		"proxy-authorization": true,
		"te":                  true,
		"trailers":            true,
	}

	return !excludeHeaders[strings.ToLower(header)]
}

func (p *Proxy) shouldForwardResponseHeader(header string) bool {
	// Similar logic for response headers
	excludeHeaders := map[string]bool{
		"content-length":    true,
		"transfer-encoding": true,
		"connection":        true,
		"upgrade":           true,
		"proxy-connection":  true,
	}

	return !excludeHeaders[strings.ToLower(header)]
}

// HealthCheck checks if services are healthy
func (p *Proxy) HealthCheck() map[string]bool {
	services := map[string]config.ServiceEndpoint{
		"auth-service":         p.config.Services.AuthService,
		"movie-service":        p.config.Services.MovieService,
		"notification-service": p.config.Services.NotificationService,
	}

	results := make(map[string]bool)

	for name, endpoint := range services {
		healthURL, err := url.JoinPath(endpoint.URL, endpoint.HealthCheckPath)
		if err != nil {
			results[name] = false
			continue
		}

		client := resty.New().SetTimeout(5 * time.Second)
		resp, err := client.R().Get(healthURL)

		results[name] = err == nil && resp.StatusCode() == http.StatusOK

		p.logger.Debug("Health check",
			"service", name,
			"url", healthURL,
			"healthy", results[name])
	}

	return results
}
