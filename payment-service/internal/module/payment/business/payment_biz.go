package business

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"payment-service/internal/module/payment/entity"
	repository "payment-service/internal/module/payment/repository/postgres"

	"github.com/samber/do"
	"github.com/uptrace/bun"
)

type PaymentBiz interface {
	ProcessSePayWebhook(ctx context.Context, webhook *entity.SePayWebhook) error
	CreateOutboxEvent(ctx context.Context, eventType string, eventData interface{}) error
}

type paymentBiz struct {
	container *do.Injector
	db        *bun.DB
	repo      repository.PaymentRepository
}

func NewPaymentBiz(i *do.Injector) (PaymentBiz, error) {
	db, err := do.Invoke[*bun.DB](i)
	if err != nil {
		return nil, err
	}

	repo, err := do.Invoke[repository.PaymentRepository](i)
	if err != nil {
		return nil, err
	}

	return &paymentBiz{
		container: i,
		db:        db,
		repo:      repo,
	}, nil
}

func (b *paymentBiz) ProcessSePayWebhook(ctx context.Context, webhook *entity.SePayWebhook) error {
	payment, err := b.repo.FindByContent(ctx, webhook.Content)
	if err != nil {
		return fmt.Errorf("failed to find payment: %w", err)
	}

	if payment == nil {
		return fmt.Errorf("payment not found for content: %s", webhook.Content)
	}

	payload, err := webhook.ToPayload()
	if err != nil {
		return fmt.Errorf("failed to marshal webhook payload: %w", err)
	}

	fields := map[string]interface{}{
		"payload":    payload,
		"status":     "completed",
		"updated_at": time.Now(),
	}

	err = b.repo.UpdateFields(ctx, payment.Id, fields)
	if err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	eventData := map[string]interface{}{
		"payment_id": payment.Id,
		"booking_id": payment.BookingId,
		"amount":     payment.Amount,
		"status":     "completed",
		"sepay_data": webhook,
	}

	err = b.CreateOutboxEvent(ctx, string(entity.EventTypePaymentCompleted), eventData)
	if err != nil {
		return fmt.Errorf("failed to create outbox event: %w", err)
	}

	return nil
}

func (b *paymentBiz) CreateOutboxEvent(ctx context.Context, eventType string, eventData interface{}) error {
	eventDataBytes, err := json.Marshal(eventData)
	if err != nil {
		return fmt.Errorf("failed to marshal event data: %w", err)
	}

	outboxEvent := &entity.OutboxEvent{
		EventType: eventType,
		Payload:   string(eventDataBytes),
		Status:    string(entity.OutboxStatusPending),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = b.db.NewInsert().Model(outboxEvent).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create outbox event: %w", err)
	}

	return nil
}
