package ws

import (
	"context"
	"github.com/gorilla/websocket"
	"time"
)

const (
	pingInterval            = 30 * time.Second // interval at which we send a PING test
	pongWait                = 60 * time.Second // PONG timeout: we must receive PONG
	requestChannelCapacity  = 100
	responseChannelCapacity = 100
)

type WSConnection struct {
	ctx          context.Context
	baseCtx      context.Context
	cancel       context.CancelFunc
	wsconn       *websocket.Conn
	requestChan  chan *WSRequest
	responseChan chan *WSResponse
	handler      *WebSocketHandler
	running      uint32
}

func (wsc *WSConnection) Context() context.Context {
	if wsc.ctx != nil {
		return wsc.ctx
	}
	baseCtx := wsc.baseCtx
	if baseCtx == nil {
		baseCtx = context.Background()
	}
	wsc.ctx, wsc.cancel = context.WithCancel(baseCtx)
	return wsc.ctx
}
