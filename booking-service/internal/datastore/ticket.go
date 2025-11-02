package datastore

import (
	"context"
	"fmt"

	"booking-service/internal/models"

	"github.com/uptrace/bun"
)

// CreateTicket creates a new ticket in the database
func CreateTicket(ctx context.Context, db bun.IDB, ticket *models.Ticket) error {
	_, err := db.NewInsert().
		Model(ticket).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create ticket: %w", err)
	}

	return nil
}

// CreateTickets creates multiple tickets in a single transaction
func CreateTickets(ctx context.Context, db bun.IDB, tickets []*models.Ticket) error {
	if len(tickets) == 0 {
		return nil
	}

	_, err := db.NewInsert().
		Model(&tickets).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create tickets: %w", err)
	}

	return nil
}

// GetTicketsByBookingId retrieves all tickets for a booking
func GetTicketsByBookingId(ctx context.Context, db bun.IDB, bookingId string) ([]*models.Ticket, error) {
	var tickets []*models.Ticket

	err := db.NewSelect().
		Model(&tickets).
		Where("booking_id = ?", bookingId).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tickets: %w", err)
	}

	return tickets, nil
}

// UpdateTicketStatus updates the status of a ticket
func UpdateTicketStatus(ctx context.Context, db bun.IDB, ticketId string, status models.TicketStatus) error {
	_, err := db.NewUpdate().
		Model((*models.Ticket)(nil)).
		Set("status = ?", status).
		Set("updated_at = CURRENT_TIMESTAMP").
		Where("id = ?", ticketId).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to update ticket status: %w", err)
	}

	return nil
}