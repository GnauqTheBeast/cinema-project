package handlers

import (
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/samber/do"
	"net/http"
	"notification-service/internal/handlers/ws"
)

type groupWebsocket struct {
	container *do.Injector
	upgrader  *websocket.Upgrader
}

func NewGroupWebsocket(container *do.Injector) *groupWebsocket {
	return &groupWebsocket{
		container: container,
		upgrader: &websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (g *groupWebsocket) WebsocketHandler(c echo.Context) error {
	w := c.Response()
	r := c.Request()
	conn, err := g.upgrader.Upgrade(w, r, nil)
	if err != nil {
		c.Logger().Errorf("Failed to upgrade WebSocket connection: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to establish WebSocket connection")
	}

	// Create a new WSConnection instance
	wsConn, err := ws.NewWSConnection(r.Context(), g.containier, conn)
	if err != nil {
		c.Logger().Errorf("Failed to create WebSocket connection: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create WebSocket connection")
	}
	defer wsConn.CloseConnection()

	wsConn.Start()

	return nil
}
