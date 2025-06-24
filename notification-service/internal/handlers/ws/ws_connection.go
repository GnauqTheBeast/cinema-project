package ws

import (
	"context"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	"github.com/samber/do"
	"github.com/sirupsen/logrus"
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

func NewWebSocketConnection(ctx context.Context, container *do.Injector, wsconn *websocket.Conn) (*WSConnection, error) {
	handler, err := NewWebSocketHandler(container)
	if err != nil {
		return nil, err
	}

	return &WSConnection{
		baseCtx:      ctx,
		wsconn:       wsconn,
		requestChan:  make(chan *WSRequest, requestChannelCapacity),
		responseChan: make(chan *WSResponse, responseChannelCapacity),
		handler:      handler,
		running:      0,
	}, nil
}

func (wsc *WSConnection) Start() {
	if !atomic.CompareAndSwapUint32(&wsc.running, 0, 1) {
		logrus.Warn("WebSocket connection is already running")
		return
	}

	wg := new(sync.WaitGroup)
	wg.Add(1)
	go func() {
		defer wg.Done()
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
	}()
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

func (wsc *WSConnection) handelRequests() {
	// wsc.handler
}

func (wsc *WSConnection) CloseConnection() {
	wsc.wsconn.Close()
}
