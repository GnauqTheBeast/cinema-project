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
	userClient    *grpc.UserClient
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

	userClient, err := grpc.NewUserClient()
	if err != nil {
		return nil, fmt.Errorf("failed to create user client: %w", err)
	}

	return &PaymentSubscriber{
		pubsub:        pubsub,
		bookingClient: bookingClient,
		userClient:    userClient,
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
				if err = s.handlePaymentCompleted(ctx, msg); err != nil {
					log.Printf("[PaymentSubscriber] Failed to handle payment_completed: %v\n", err)
				}
			}
		}
	}()

	log.Println("[PaymentSubscriber] Payment subscriber started successfully")
	return nil
}

func (s *PaymentSubscriber) unmarshalPaymentMessage(data []byte) (interface{}, error) {
	var msg map[string]interface{}
	if err := json.Unmarshal(data, &msg); err != nil {
		log.Printf("[PaymentSubscriber] Unmarshal error: %v\n", err)
		return nil, err
	}

	log.Printf("[PaymentSubscriber] Unmarshaled message: %+v\n", msg)
	return msg, nil
}

func (s *PaymentSubscriber) handlePaymentCompleted(ctx context.Context, msg *pubsub.Message) error {
	outerData, ok := msg.Data.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid message data format")
	}

	data, ok := outerData["Data"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid nested data format")
	}

	paymentID, ok := data["payment_id"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid payment_id")
	}

	bookingID, ok := data["booking_id"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid booking_id")
	}

	amount, ok := data["amount"].(float64)
	if !ok {
		amountInt, ok := data["amount"].(int)
		if !ok {
			return fmt.Errorf("missing or invalid amount")
		}
		amount = float64(amountInt)
	}

	// Call gRPC to update booking status and get userId
	resp, err := s.bookingClient.UpdateBookingStatusWithResponse(ctx, bookingID, "confirmed")
	if err != nil {
		return fmt.Errorf("failed to update booking status via gRPC: %w", err)
	}

	userID := resp.UserId
	userEmail, err := s.userClient.GetUserEmailById(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user email via gRPC: %w", err)
	}

	// Create tickets for the booking and get details for email
	ticketResp, err := s.bookingClient.CreateTicketsWithDetails(ctx, bookingID)
	if err != nil {
		log.Printf("[PaymentSubscriber] Failed to create tickets for booking %s: %v\n", bookingID, err)
	}

	// Prepare notification data
	notificationData := map[string]interface{}{
		"user_id":    userID,
		"booking_id": bookingID,
		"payment_id": paymentID,
		"amount":     amount,
		"status":     "completed",
		"timestamp":  time.Now().Unix(),
		"title":      "Payment Successful",
		"message":    fmt.Sprintf("Your booking %s has been confirmed. Payment of %.2f VND received.", bookingID, amount),
	}

	// Message 1: Publish to "booking_success" topic for notification-service to send email with barcode
	// Include full booking details if available
	emailData := map[string]interface{}{
		"user_id":    userID,
		"user_email": userEmail,
		"booking_id": bookingID,
	}

	if ticketResp != nil && ticketResp.BookingDetails != nil {
		details := ticketResp.BookingDetails

		// Safely handle seats array
		if details.Seats != nil && len(details.Seats) > 0 {
			seats := make([]map[string]interface{}, 0, len(details.Seats))
			for _, seat := range details.Seats {
				seats = append(seats, map[string]interface{}{
					"seat_row":    seat.SeatRow,
					"seat_number": seat.SeatNumber,
					"seat_type":   seat.SeatType,
				})
			}
			emailData["seats"] = seats
		}

		if details.UserEmail != "" {
			emailData["to"] = details.UserEmail
		}

		// Safely handle showtime details
		if details.Showtime != nil {
			emailData["showtime"] = map[string]interface{}{
				"showtime_id": details.Showtime.ShowtimeId,
				"start_time":  details.Showtime.StartTime,
				"movie_name":  details.Showtime.MovieName,
				"room_name":   details.Showtime.RoomName,
			}
		}
	}

	emailMessage := &pubsub.Message{
		Topic: "booking_success",
		Data:  emailData,
	}

	_ = s.pubsub.Publish(ctx, emailMessage)

	// Message 2: Publish to "booking_<userId>" topic for WebSocket
	userNotificationTopic := fmt.Sprintf("booking_%s", userID)
	userMessage := &pubsub.Message{
		Topic: userNotificationTopic,
		Data:  notificationData,
	}

	_ = s.pubsub.Publish(ctx, userMessage)

	return nil
}
