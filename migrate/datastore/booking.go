package datastore

import (
	"context"
	"fmt"

	"migrate-cmd/models"

	"github.com/uptrace/bun"
)

func CreateBookingTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.Booking)(nil)).
		IfNotExists().
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create bookings table: %w", err)
	}
	return nil
}

func CreateTicketTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.Ticket)(nil)).
		IfNotExists().
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create tickets table: %w", err)
	}
	return nil
}

func CreatePaymentTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.Payment)(nil)).
		IfNotExists().
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create payments table: %w", err)
	}
	return nil
}
