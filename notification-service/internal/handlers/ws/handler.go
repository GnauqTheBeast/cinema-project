package ws

import (
	"github.com/samber/do"
)

type WebSocketHandler struct {
	containier *do.Injector
}

func NewWebSocketHandler(container *do.Injector) (*WebSocketHandler, error) {
	return &WebSocketHandler{
		containier: container,
	}, nil
}
