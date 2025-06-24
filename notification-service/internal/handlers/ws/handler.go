package ws

import (
	"context"
	"github.com/samber/do"
)

type WebsocketHandler struct {
	containier *do.Injector
}

func NewWebSocketHandler(container *do.Injector) *WebsocketHandler {
	return &WebsocketHandler{
		containier: container,
	}
}

func (h *WebsocketHandler) NewWebSocketConnection(ctx context.Context) error {}
