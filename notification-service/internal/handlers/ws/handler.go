package ws

import (
	"encoding/json"
	"fmt"

	"github.com/samber/do"
	"notification-service/internal/pkg/pubsub"
	"notification-service/internal/services"
	"notification-service/internal/types"
)

type WebSocketHandler struct {
	containier   *do.Injector
	pubsub       pubsub.PubSub
	emailService *services.EmailService
}

func NewWebSocketHandler(container *do.Injector) (*WebSocketHandler, error) {
	pubsub, err := do.Invoke[pubsub.PubSub](container)
	if err != nil {
		return nil, err
	}

	emailService, err := do.Invoke[*services.EmailService](container)
	if err != nil {
		return nil, err
	}

	return &WebSocketHandler{
		containier:   container,
		pubsub:       pubsub,
		emailService: emailService,
	}, nil
}

func (h *WebSocketHandler) notificatonHandler(ctx *WSContext, request *WSRequest) (*WSResponse, error) {
	if request.Id <= 0 {
		return &WSResponse{
			Id:     request.Id,
			Result: nil,
			Error:  &WSError{Code: 400, Message: "Invalid request ID"},
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

	topic := fmt.Sprintf("notification_%s", userId)

	subscriber, err := h.pubsub.Subscribe(ctx.Context(), []string{topic}, types.UnmarshalEmailVerify)
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

		for {
			select {
			case <-ctx.Context().Done():
				fmt.Println("Context done, stopping subscriber")
				return
			case msg := <-subscriber.MessageChan():
				if msg.Topic == fmt.Sprintf("email_verify_%s", userId) {
					h.handleEmailVerify(ctx, request.Id, msg.Data.(*types.EmailVerifyMessage))
				}
			}
		}
	}()

	return &WSResponse{
		Id:     request.Id,
		Result: json.RawMessage(`{"status": "success", "message": "Notification sent"}`),
		Error:  nil,
	}, nil
}

func (h *WebSocketHandler) handleEmailVerify(ctx *WSContext, requestId int, message *types.EmailVerifyMessage) {
	emailVerify := &types.EmailVerify{
		From:       "quangnguyenngoc314@gmail.com",
		To:         message.To,
		Subject:    "Verify your email",
		VerifyCode: message.VerifyCode,
		VerifyURL:  fmt.Sprintf("https://example.com/verify?code=%s", message.VerifyCode),
	}

	_ = h.emailService.SendVerifyEmail(emailVerify)

	response := &WSResponse{
		Id:     requestId,
		Result: json.RawMessage(`{"status": "email sent"}`),
		Error:  nil,
	}

	ctx.WSConn.sendMessage(response)
}
