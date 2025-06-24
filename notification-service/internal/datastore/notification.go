package datastore

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"
	"notification-service/internal/models"
)

func CreateNotificationTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.Notification)(nil)).
		IfNotExists().
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create notification table: %w", err)
	}

	return nil
}

func GetNotificationsByUserId(ctx context.Context, db *bun.DB, userId string, limit, offset int) ([]*models.Notification, error) {
	notis := make([]*models.Notification, 0)

	err := db.NewSelect().
		Model(&notis).
		Where("user_id = ?", userId).
		Where("status != ?", models.NotificationStatusDeleted).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	return notis, nil
}
