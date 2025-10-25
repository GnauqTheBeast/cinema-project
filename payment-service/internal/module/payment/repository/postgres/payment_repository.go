package repository

import (
	"context"

	"payment-service/internal/module/payment/entity"
)

type PaymentRepository interface {
	FindByContent(ctx context.Context, content string) (*entity.Payment, error)
	UpdateFields(ctx context.Context, id string, fields map[string]interface{}) error
	Create(ctx context.Context, payment *entity.Payment) error
	GetById(ctx context.Context, id string) (*entity.Payment, error)
}
