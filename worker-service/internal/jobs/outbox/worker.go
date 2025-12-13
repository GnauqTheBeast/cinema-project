package outbox

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"worker-service/internal/models"
	"worker-service/internal/pkg/logger"
	"worker-service/internal/pkg/pubsub"

	"github.com/redis/go-redis/v9"
	"github.com/samber/do"
	"github.com/uptrace/bun"
)

type Worker struct {
	db          *bun.DB
	logger      logger.Logger
	pubsub      pubsub.PubSub
	redisClient redis.UniversalClient
}

func NewWorker(ctn *do.Injector) (*Worker, error) {
	db, err := do.Invoke[*bun.DB](ctn)
	if err != nil {
		return nil, err
	}

	log, err := do.Invoke[logger.Logger](ctn)
	if err != nil {
		return nil, err
	}

	pubsub, err := do.Invoke[pubsub.PubSub](ctn)
	if err != nil {
		return nil, err
	}

	redisClient, err := do.InvokeNamed[redis.UniversalClient](ctn, "redis-db")
	if err != nil {
		return nil, err
	}

	return &Worker{
		db:          db,
		logger:      log,
		pubsub:      pubsub,
		redisClient: redisClient,
	}, nil
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
	events := make([]models.OutboxEvent, 0)

	err := w.db.NewSelect().
		Model(&events).
		Where("status = ?", models.OutboxStatusPending).
		OrderExpr("id ASC").
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
		if err = w.processEvent(ctx, event); err != nil {
			w.logger.Error("Failed to process event %d: %v", event.ID, err)
			err = w.markEventAsFailed(ctx, event.ID, err)
			if err != nil {
				return err
			}
			continue
		}

		if err = w.markEventAsSent(ctx, event.ID); err != nil {
			w.logger.Error("Failed to mark event %d as sent: %v", event.ID, err)
		}
	}

	return nil
}

func (w *Worker) processEvent(ctx context.Context, event models.OutboxEvent) error {
	w.logger.Debug("Processing event: %s - %s", event.EventType, event.Payload)

	switch event.EventType {
	case models.EventTypeBookingCreated:
		return w.handleBookingCreated(ctx, event)
	default:
		w.logger.Warn("Unknown event type: %s", event.EventType)
		return nil
	}
}

func (w *Worker) handleBookingCreated(ctx context.Context, event models.OutboxEvent) error {
	data := new(models.BookingEventData)
	if err := json.Unmarshal([]byte(event.Payload), data); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	bookingID := data.BookingId
	seatIds := data.SeatIds
	showtimeId := data.ShowtimeId

	w.logger.Info("Handling booking created event for booking ID: %s", bookingID)

	seatLockKeys := make([]string, len(seatIds))
	for i, seatId := range seatIds {
		seatLockKeys[i] = fmt.Sprintf("seat_lock:%s:%s", showtimeId, seatId)
	}

	acquiredLocks := make([]string, 0)
	for _, lockKey := range seatLockKeys {
		acquired, err := w.acquireSeatLock(ctx, lockKey, bookingID, 5*time.Minute)
		if err != nil {
			w.releaseSeatLocks(ctx, acquiredLocks)
			return fmt.Errorf("failed to acquire seat lock %s: %w", lockKey, err)
		}
		if !acquired {
			w.releaseSeatLocks(ctx, acquiredLocks)
			return fmt.Errorf("seat %s is already locked", lockKey)
		}
		acquiredLocks = append(acquiredLocks, lockKey)
	}

	w.logger.Info("Successfully locked %d seats for booking %s", len(seatIds), bookingID)
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

func (w *Worker) acquireSeatLock(ctx context.Context, lockKey, bookingID string, ttl time.Duration) (bool, error) {
	result, err := w.redisClient.SetNX(ctx, lockKey, bookingID, ttl).Result()
	if err != nil {
		return false, fmt.Errorf("failed to acquire lock: %w", err)
	}
	return result, nil
}

func (w *Worker) releaseSeatLocks(ctx context.Context, lockKeys []string) {
	for _, lockKey := range lockKeys {
		err := w.redisClient.Del(ctx, lockKey).Err()
		if err != nil {
			w.logger.Error("Failed to release seat lock %s: %v", lockKey, err)
		}
	}
}
