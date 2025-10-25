package outbox

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"worker-service/internal/models"
	"worker-service/internal/pkg/pubsub"

	"github.com/samber/do"
	"github.com/uptrace/bun"
)

type Worker struct {
	db     *bun.DB
	logger Logger
	pubsub pubsub.PubSub
}

type Logger interface {
	Info(msg string, args ...interface{})
	Error(msg string, args ...interface{})
	Debug(msg string, args ...interface{})
	Warn(msg string, args ...interface{})
}

func NewWorker(ctn *do.Injector) *Worker {
	db := do.MustInvoke[*bun.DB](ctn)
	logger := do.MustInvoke[Logger](ctn)
	pubsub := do.MustInvoke[pubsub.PubSub](ctn)

	return &Worker{
		db:     db,
		logger: logger,
		pubsub: pubsub,
	}
}

func (w *Worker) Start(ctx context.Context) error {
	w.logger.Info("Starting outbox worker...")

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("Outbox worker stopped")
			return ctx.Err()
		case <-ticker.C:
			if err := w.processEvents(ctx); err != nil {
				w.logger.Error("Failed to process outbox events: %v", err)
			}
		}
	}
}

func (w *Worker) processEvents(ctx context.Context) error {
	var events []models.OutboxEvent

	err := w.db.NewSelect().
		Model(&events).
		Where("status = ?", models.OutboxStatusPending).
		Order("id ASC").
		Limit(100).
		Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to query outbox events: %w", err)
	}

	if len(events) == 0 {
		return nil
	}

	w.logger.Debug("Processing %d outbox events", len(events))

	for _, event := range events {
		if err := w.processEvent(ctx, event); err != nil {
			w.logger.Error("Failed to process event %d: %v", event.ID, err)
			w.markEventAsFailed(ctx, event.ID, err)
			continue
		}

		if err := w.markEventAsSent(ctx, event.ID); err != nil {
			w.logger.Error("Failed to mark event %d as sent: %v", event.ID, err)
		}
	}

	return nil
}

func (w *Worker) processEvent(ctx context.Context, event models.OutboxEvent) error {
	w.logger.Debug("Processing event: %s - %s", event.EventType, event.Payload)

	switch event.EventType {
	case string(models.EventTypeBookingCreated):
		return w.handleBookingCreated(ctx, event)
	case string(models.EventTypePaymentCompleted):
		return w.handlePaymentCompleted(ctx, event)
	case string(models.EventTypeSeatReserved):
		return w.handleSeatReserved(ctx, event)
	case string(models.EventTypeSeatReleased):
		return w.handleSeatReleased(ctx, event)
	case string(models.EventTypeNotificationSent):
		return w.handleNotificationSent(ctx, event)
	default:
		w.logger.Warn("Unknown event type: %s", event.EventType)
		return nil
	}
}

func (w *Worker) handleBookingCreated(ctx context.Context, event models.OutboxEvent) error {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(event.Payload), &data); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	bookingID, ok := data["booking_id"].(float64)
	if !ok {
		return fmt.Errorf("invalid booking_id in payload")
	}

	w.logger.Info("Handling booking created event for booking ID: %.0f", bookingID)

	// Simulate processing time
	time.Sleep(100 * time.Millisecond)

	// Here you would typically:
	// 1. Send notification to user
	// 2. Update booking status
	// 3. Trigger payment process
	// 4. Send events to other services

	w.logger.Info("Booking created event processed successfully")
	return nil
}

func (w *Worker) handlePaymentCompleted(ctx context.Context, event models.OutboxEvent) error {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(event.Payload), &data); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	paymentID, ok := data["payment_id"].(string)
	if !ok {
		return fmt.Errorf("invalid payment_id in payload")
	}

	bookingID, ok := data["booking_id"].(string)
	if !ok {
		return fmt.Errorf("invalid booking_id in payload")
	}

	amount, ok := data["amount"].(float64)
	if !ok {
		return fmt.Errorf("invalid amount in payload")
	}

	w.logger.Info("Handling payment completed event for payment ID: %s, booking ID: %s, amount: %.2f", paymentID, bookingID, amount)

	notificationMessage := map[string]interface{}{
		"type":       "payment_completed",
		"payment_id": paymentID,
		"booking_id": bookingID,
		"amount":     amount,
		"status":     "completed",
		"timestamp":  time.Now().Unix(),
	}

	message := &pubsub.Message{
		Topic: "payment.notifications",
		Data:  notificationMessage,
	}

	err := w.pubsub.Publish(ctx, message)
	if err != nil {
		return fmt.Errorf("failed to publish notification message: %w", err)
	}

	w.logger.Info("Payment completed notification sent for payment ID: %s", paymentID)
	return nil
}

func (w *Worker) handleSeatReserved(ctx context.Context, event models.OutboxEvent) error {
	w.logger.Info("Handling seat reserved event: %s", event.Payload)
	// Implement seat reservation logic
	return nil
}

func (w *Worker) handleSeatReleased(ctx context.Context, event models.OutboxEvent) error {
	w.logger.Info("Handling seat released event: %s", event.Payload)
	// Implement seat release logic
	return nil
}

func (w *Worker) handleNotificationSent(ctx context.Context, event models.OutboxEvent) error {
	w.logger.Info("Handling notification sent event: %s", event.Payload)
	// Implement notification logic
	return nil
}

func (w *Worker) markEventAsSent(ctx context.Context, eventID int) error {
	_, err := w.db.NewUpdate().
		Model((*models.OutboxEvent)(nil)).
		Set("status = ?", models.OutboxStatusSent).
		Set("updated_at = ?", time.Now()).
		Where("id = ?", eventID).
		Exec(ctx)

	return err
}

func (w *Worker) markEventAsFailed(ctx context.Context, eventID int, err error) error {
	_, updateErr := w.db.NewUpdate().
		Model((*models.OutboxEvent)(nil)).
		Set("status = ?", models.OutboxStatusFailed).
		Set("updated_at = ?", time.Now()).
		Where("id = ?", eventID).
		Exec(ctx)

	if updateErr != nil {
		w.logger.Error("Failed to mark event %d as failed: %v", eventID, updateErr)
	}

	return updateErr
}
