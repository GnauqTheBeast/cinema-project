package datastore

import (
	"context"
	"fmt"

	"migrate-cmd/models"

	"github.com/uptrace/bun"
)

func CreatePermissionTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.Permission)(nil)).
		IfNotExists().
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create permissions table: %w", err)
	}
	return nil
}
