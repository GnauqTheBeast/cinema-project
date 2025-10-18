package datastore

import (
	"context"
	"fmt"

	"booking-service/internal/models"

	"github.com/uptrace/bun"
)

func CreateBookingTable(ctx context.Context, db *bun.DB) error {
	_, err := db.NewCreateTable().
		Model((*models.Booking)(nil)).
		IfNotExists().
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create booking table: %w", err)
	}

	return nil
}

func GetBookingsByUserId(ctx context.Context, db *bun.DB, userId string, limit, offset int) ([]*models.Booking, error) {
	bookings := make([]*models.Booking, 0)

	err := db.NewSelect().
		Model(&bookings).
		Where("user_id = ?", userId).
		Where("status IN (?, ?, ?)", models.BookingStatusPending, models.BookingStatusConfirmed, models.BookingStatusCancelled).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get bookings by user id: %w", err)
	}

	return bookings, nil
}

func GetBookingsByUserIdAndStatus(ctx context.Context, db *bun.DB, userId string, status models.BookingStatus, limit, offset int) ([]*models.Booking, error) {
	bookings := make([]*models.Booking, 0)

	err := db.NewSelect().
		Model(&bookings).
		Where("user_id = ?", userId).
		Where("status = ?", status).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get bookings by user id and status: %w", err)
	}

	return bookings, nil
}

func GetTotalBookingsByUserIdAndStatus(ctx context.Context, db *bun.DB, userId string, status models.BookingStatus) (int, error) {
	count, err := db.NewSelect().
		Model((*models.Booking)(nil)).
		Where("user_id = ?", userId).
		Where("status = ?", status).
		Count(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to get total bookings count by status: %w", err)
	}

	return count, nil
}

func GetBookingById(ctx context.Context, db *bun.DB, id string) (*models.Booking, error) {
	booking := new(models.Booking)

	err := db.NewSelect().
		Model(booking).
		Where("id = ?", id).
		Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get booking by id: %w", err)
	}

	return booking, nil
}

func CreateBooking(ctx context.Context, db *bun.DB, booking *models.Booking) error {
	_, err := db.NewInsert().
		Model(booking).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create booking: %w", err)
	}

	return nil
}

func UpdateBooking(ctx context.Context, db *bun.DB, booking *models.Booking) error {
	_, err := db.NewUpdate().
		Model(booking).
		Where("id = ?", booking.Id).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to update booking: %w", err)
	}

	return nil
}

func MarkBookingsAsConfirmed(ctx context.Context, db *bun.DB, bookingIds []string, userId string) error {
	_, err := db.NewUpdate().
		Model((*models.Booking)(nil)).
		Set("status = ?", models.BookingStatusConfirmed).
		Where("id IN (?)", bun.In(bookingIds)).
		Where("user_id = ?", userId).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to mark notifications as read: %w", err)
	}

	return nil
}

func GetTotalBookingsByUserId(ctx context.Context, db *bun.DB, userId string) (int, error) {
	count, err := db.NewSelect().
		Model((*models.Booking)(nil)).
		Where("user_id = ?", userId).
		Where("status IN (?, ?, ?)", models.BookingStatusPending, models.BookingStatusConfirmed, models.BookingStatusCancelled).
		Count(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to get total bookings count: %w", err)
	}

	return count, nil
}
