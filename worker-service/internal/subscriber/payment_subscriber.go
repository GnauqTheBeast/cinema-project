package subscriber

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"worker-service/internal/grpc"
	"worker-service/internal/pkg/pubsub"

	"github.com/samber/do"
)

type PaymentSubscriber struct {
	pubsub        pubsub.PubSub
	bookingClient *grpc.BookingClient
}

func NewPaymentSubscriber(i *do.Injector) (*PaymentSubscriber, error) {
	pubsub, err := do.Invoke[pubsub.PubSub](i)
	if err != nil {
		return nil, err
	}

	bookingClient, err := grpc.NewBookingClient()
	if err != nil {
		return nil, fmt.Errorf("failed to create booking client: %w", err)
	}

	return &PaymentSubscriber{
		pubsub:        pubsub,
		bookingClient: bookingClient,
	}, nil
}

func (s *PaymentSubscriber) Start(ctx context.Context) error {
	log.Println("[PaymentSubscriber] Starting payment subscriber...")

	// Subscribe to payment_completed topic
	subscriber, err := s.pubsub.Subscribe(ctx, []string{"payment_completed"}, s.unmarshalPaymentMessage)
	if err != nil {
		return fmt.Errorf("failed to subscribe to payment_completed: %w", err)
	}

	go func() {
		defer subscriber.Unsubscribe(ctx)

		messageChan := subscriber.MessageChan()

		for {
			select {
			case <-ctx.Done():
				log.Println("[PaymentSubscriber] Payment subscriber stopped")
				return
			case msg := <-messageChan:
				if msg == nil {
					continue
				}
				if err := s.handlePaymentCompleted(ctx, msg); err != nil {
					log.Printf("[PaymentSubscriber] Failed to handle payment_completed: %v\n", err)
				}
			}
		}
	}()

	log.Println("[PaymentSubscriber] Payment subscriber started successfully")
	return nil
}

func (s *PaymentSubscriber) unmarshalPaymentMessage(data []byte) (interface{}, error) {
	log.Printf("[PaymentSubscriber] Unmarshaling message, raw data: %s\n", string(data))

	var msg map[string]interface{}
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("[PaymentSubscriber] Unmarshal error: %v\n", err)
		return nil, err
	}

	log.Printf("[PaymentSubscriber] Unmarshaled message: %+v\n", msg)
	return msg, nil
}

func (s *PaymentSubscriber) handlePaymentCompleted(ctx context.Context, msg *pubsub.Message) error {
	// The unmarshaled message has structure: {Topic: "...", Data: {...}}
	// So msg.Data is actually the outer map, we need to extract the nested "Data" field
	outerData, ok := msg.Data.(map[string]interface{})
	if !ok {
		log.Printf("[PaymentSubscriber] msg.Data type assertion failed, got type: %T\n", msg.Data)
		return fmt.Errorf("invalid message data format")
	}

	// Extract the nested "Data" field
	data, ok := outerData["Data"].(map[string]interface{})
	if !ok {
		log.Printf("[PaymentSubscriber] nested Data field type assertion failed, got type: %T\n", outerData["Data"])
		return fmt.Errorf("invalid nested data format")
	}

	paymentID, ok := data["payment_id"].(string)
	if !ok {
		log.Printf("[PaymentSubscriber] payment_id not found or invalid, available keys: %v\n", data)
		return fmt.Errorf("missing or invalid payment_id")
	}

	bookingID, ok := data["booking_id"].(string)
	if !ok {
		log.Printf("[PaymentSubscriber] booking_id not found or invalid, available keys: %v\n", data)
		return fmt.Errorf("missing or invalid booking_id")
	}

	amount, ok := data["amount"].(float64)
	if !ok {
		// Try int conversion
		amountInt, ok := data["amount"].(int)
		if !ok {
			log.Printf("[PaymentSubscriber] amount not found or invalid type: %T\n", data["amount"])
			return fmt.Errorf("missing or invalid amount")
		}
		amount = float64(amountInt)
	}

	log.Printf("[PaymentSubscriber] Received payment_completed event for payment %s, booking %s, amount: %.2f\n", paymentID, bookingID, amount)

	if err := s.bookingClient.UpdateBookingStatus(ctx, bookingID, "confirmed"); err != nil {
		return fmt.Errorf("failed to update booking status via gRPC: %w", err)
	}

	log.Printf("[PaymentSubscriber] Booking %s status updated to confirmed via gRPC\n", bookingID)

	// Publish notification message
	notificationMessage := map[string]interface{}{
		"type":       "payment_completed",
		"payment_id": paymentID,
		"booking_id": bookingID,
		"amount":     amount,
		"status":     "completed",
		"timestamp":  time.Now().Unix(),
	}

	message := &pubsub.Message{
		Topic: "booking_success",
		Data:  notificationMessage,
	}

	if err := s.pubsub.Publish(ctx, message); err != nil {
		return fmt.Errorf("failed to publish notification message: %w", err)
	}

	log.Printf("[PaymentSubscriber] Payment completed notification sent for payment ID: %s\n", paymentID)

	return nil
}
