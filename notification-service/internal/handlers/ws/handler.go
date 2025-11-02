package ws

import (
	"encoding/json"
	"fmt"

	"github.com/samber/do"
	"notification-service/internal/pkg/pubsub"
	"notification-service/internal/types"
)

type WebSocketHandler struct {
	containier *do.Injector
	pubsub     pubsub.PubSub
}

func NewWebSocketHandler(container *do.Injector) (*WebSocketHandler, error) {
	pubsub, err := do.Invoke[pubsub.PubSub](container)
	if err != nil {
		return nil, err
	}

	return &WebSocketHandler{
		containier: container,
		pubsub:     pubsub,
	}, nil
}

func (h *WebSocketHandler) notificatonHandler(ctx *WSContext, request *WSRequest) (*WSResponse, error) {
	if request.Id <= 0 {
		return &WSResponse{
			Id:     request.Id,
			Result: nil,
			Error:  &WSError{Code: 400, Message: "Invalid request Id"},
		}, nil
	}

	params := make(map[string]interface{})
	if err := json.Unmarshal(request.Params, &params); err != nil {
		return &WSResponse{
			Id:     request.Id,
			Result: nil,
			Error:  &WSError{Code: 400, Message: "Invalid params"},
		}, nil
	}

	userId, ok := params["userId"].(string)
	if !ok || userId == "" {
		return &WSResponse{
			Id:     request.Id,
			Result: nil,
			Error:  &WSError{Code: 400, Message: "Missing or invalid userId"},
		}, nil
	}

	topic := notificationTopic(userId)
	subscriber, err := h.pubsub.Subscribe(ctx.Context(), []string{topic}, types.UnmarshalNotificationMessage)
	if err != nil {
		return &WSResponse{
			Id:     request.Id,
			Result: nil,
			Error:  &WSError{Code: 500, Message: "Failed to subscribe to topic"},
		}, err
	}

	go func() {
		defer func() {
			_ = subscriber.Unsubscribe(ctx.Context())
		}()

		messageChan := subscriber.MessageChan()
		for {
			select {
			case <-ctx.Context().Done():
				fmt.Println("Context done, stopping subscriber")
				return
			case msg := <-messageChan:
				if msg.Topic == notificationTopic(userId) {
					ctx.WSConn.sendMessage(&WSResponse{
						Id:     request.Id,
						Result: json.RawMessage(`{"status": "notification sent"}`),
						Error:  nil,
					})
				}

				// TODO: handle booking_success here
			}
		}
	}()

	return &WSResponse{
		Id:     request.Id,
		Result: json.RawMessage(`{"status": "success", "message": "Notification sent"}`),
		Error:  nil,
	}, nil
}
