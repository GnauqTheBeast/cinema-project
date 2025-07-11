package services

import (
	"context"

	"notification-service/internal/datastore"
	"notification-service/internal/models"

	"github.com/samber/do"
	"github.com/uptrace/bun"
)

type NotificationService struct {
	container *do.Injector
	roDb      *bun.DB
}

func NewNotificationService(container *do.Injector) (*NotificationService, error) {
	roDb, err := do.Invoke[*bun.DB](container)
	if err != nil {
		return nil, err
	}

	return &NotificationService{
		container: container,
		roDb:      roDb,
	}, nil
}

func (notiService *NotificationService) GetUserNotifications(ctx context.Context, userId string, limit int, offset int) ([]*models.Notification, error) {
	notifications, err := datastore.GetNotificationsByUserId(ctx, notiService.roDb, userId, limit, offset)
	if err != nil {
		return nil, err
	}

	return notifications, nil
}
