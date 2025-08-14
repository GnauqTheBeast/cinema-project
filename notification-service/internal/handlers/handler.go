package handlers

import (
	"net/http"

	"notification-service/internal/types"

	"github.com/labstack/echo-contrib/pprof"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/samber/do"
)

type Config struct {
	Container *do.Injector
	Mode      string
	Origins   []string
}

func New(cfg *Config) (http.Handler, error) {
	r := echo.New()
	r.Pre(middleware.RemoveTrailingSlash())
	if cfg.Mode == "debug" {
		r.Debug = true
		pprof.Register(r)
	}

	r.IPExtractor = echo.ExtractIPFromXFFHeader()

	// TODO: check if JSONSerializer needed on http request
	/// r.JSONSerializer = httpx.SegmentJSONSerializer{}
	r.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "${time_rfc3339}\t${method}\t${uri}\t${status}\t${latency_human}\n",
	}))
	r.Use(middleware.Recover())
	cors := middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.Origins,
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
		MaxAge:           60 * 60,
	})
	r.Use(cors)

	r.GET("", Hello)

	routesAPIv1 := r.Group("/api/v1")
	{
		routesAPIv1.GET("", Hello)

		// Initialize notification handler
		notificationHandler, err := NewNotificationHandler(cfg.Container)
		if err != nil {
			return nil, err
		}

		routesNoti := routesAPIv1.Group("/notifications")
		{
			// GET /api/v1/notifications/:userId - Get notifications with pagination
			routesNoti.GET("/:userId", notificationHandler.GetNotifications)

			// GET /api/v1/notifications/:userId/:id - Get single notification
			routesNoti.GET("/:userId/:id", notificationHandler.GetNotificationById)

			// POST /api/v1/notifications - Create notification
			routesNoti.POST("", notificationHandler.CreateNotification)

			// PUT /api/v1/notifications/:userId/:id/status - Update notification status
			routesNoti.PUT("/:userId/:id/status", notificationHandler.UpdateNotificationStatus)

			// DELETE /api/v1/notifications/:userId/:id - Delete notification
			routesNoti.DELETE("/:userId/:id", notificationHandler.DeleteNotification)

			// POST /api/v1/notifications/:userId/mark-read - Mark notifications as read
			routesNoti.POST("/:userId/mark-read", notificationHandler.MarkAsRead)

			// GET /api/v1/notifications/:userId/unread-count - Get unread count
			routesNoti.GET("/:userId/unread-count", notificationHandler.GetUnreadCount)
		}
	}

	groupWebSocket := NewGroupWebSocket(cfg.Container)
	r.GET("/ws", groupWebSocket.WebsocketHandleConnection)

	return r, nil
}

func Hello(c echo.Context) error {
	return types.ResponseWithMessage(c, &types.Body{
		Code:    http.StatusOK,
		Message: http.StatusText(http.StatusOK),
		Data:    "Hello World!",
	})
}
