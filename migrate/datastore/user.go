package datastore

import (
	"context"
	"fmt"

	"migrate-cmd/models"

	"github.com/uptrace/bun"
)

func CreateUserTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.User)(nil)).
		IfNotExists().
		ForeignKey("(role_id) REFERENCES roles(id)").
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create users table: %w", err)
	}
	return nil
}

func CreateStaffProfileTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.StaffProfile)(nil)).
		IfNotExists().
		ForeignKey(`(user_id) REFERENCES users(id) ON DELETE CASCADE`).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create staff_profile table: %w", err)
	}
	return nil
}

func CreateCustomerProfileTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.CustomerProfile)(nil)).
		IfNotExists().
		ForeignKey(`(user_id) REFERENCES users(id) ON DELETE CASCADE`).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create customer_profile table: %w", err)
	}
	return nil
}

func CreateRolePermissionTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.RolePermission)(nil)).
		IfNotExists().
		ForeignKey(`(role_id) REFERENCES roles(id) ON DELETE CASCADE`).
		ForeignKey(`(permission_id) REFERENCES permissions(id) ON DELETE CASCADE`).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create role_permissions table: %w", err)
	}
	return nil
}
