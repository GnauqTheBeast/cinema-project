package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"booking-service/internal/datastore"
	"booking-service/internal/grpc"
	"booking-service/internal/models"
	"booking-service/internal/pkg/pubsub"
	"booking-service/internal/types"
	"booking-service/proto/pb"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/samber/do"
	"github.com/uptrace/bun"
)

var (
	ErrInvalidBookingData = fmt.Errorf("invalid booking data")
	ErrBookingNotFound    = fmt.Errorf("booking not found")
	ErrUnauthorized       = fmt.Errorf("unauthorized access")
	ErrSeatAlreadyLocked  = fmt.Errorf("one or more seats are already locked")
)

type BookingService struct {
	container   *do.Injector
	db          *bun.DB
	roDb        *bun.DB
	movieClient *grpc.MovieClient
	redisClient redis.UniversalClient
	pubsub      pubsub.PubSub
}

func NewBookingService(container *do.Injector) (*BookingService, error) {
	db, err := do.Invoke[*bun.DB](container)
	if err != nil {
		return nil, err
	}

	roDb, err := do.InvokeNamed[*bun.DB](container, "readonly-db")
	if err != nil {
		return nil, err
	}

	movieClient, err := do.Invoke[*grpc.MovieClient](container)
	if err != nil {
		return nil, err
	}

	redisClient, err := do.InvokeNamed[redis.UniversalClient](container, "redis-db")
	if err != nil {
		return nil, err
	}

	pubsubClient, err := do.Invoke[pubsub.PubSub](container)
	if err != nil {
		return nil, err
	}

	return &BookingService{
		container:   container,
		db:          db,
		roDb:        roDb,
		movieClient: movieClient,
		redisClient: redisClient,
		pubsub:      pubsubClient,
	}, nil
}

func (s *BookingService) GetUserBookings(ctx context.Context, userId string, page, size int, status string) ([]*types.BookingHistory, int, error) {
	if userId == "" {
		return nil, 0, ErrInvalidBookingData
	}

	if page <= 0 {
		page = 1
	}
	if size <= 0 {
		size = 10
	}
	if size > 100 {
		size = 100
	}

	limit := size
	offset := (page - 1) * size

	var bookings []*models.Booking
	var total int
	var err error

	if status != "" && s.isValidStatus(status) {
		bookingStatus := models.BookingStatus(status)
		bookings, err = datastore.GetBookingsByUserIdAndStatus(ctx, s.roDb, userId, bookingStatus, limit, offset)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get bookings by status: %w", err)
		}

		total, err = datastore.GetTotalBookingsByUserIdAndStatus(ctx, s.roDb, userId, bookingStatus)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get total count by status: %w", err)
		}

		enrichedBookings, err := s.enrichBookingsWithShowtimeData(ctx, bookings)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to enrich bookings: %w", err)
		}

		return enrichedBookings, total, nil
	}

	bookings, err = datastore.GetBookingsByUserId(ctx, s.roDb, userId, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get bookings: %w", err)
	}

	enrichedBookings, err := s.enrichBookingsWithShowtimeData(ctx, bookings)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to enrich bookings: %w", err)
	}

	return enrichedBookings, total, nil
}

func (s *BookingService) enrichBookingsWithShowtimeData(ctx context.Context, bookings []*models.Booking) ([]*types.BookingHistory, error) {
	if len(bookings) == 0 {
		return []*types.BookingHistory{}, nil
	}

	showtimeIds := make([]string, 0, len(bookings))
	for _, booking := range bookings {
		showtimeIds = append(showtimeIds, booking.ShowtimeId)
	}

	showtimes, err := s.movieClient.GetShowtimes(ctx, showtimeIds)
	if err != nil {
		return nil, fmt.Errorf("failed to get showtime data: %w", err)
	}

	showtimeMap := make(map[string]*pb.ShowtimeData)
	for _, showtime := range showtimes {
		showtimeMap[showtime.Id] = showtime
	}

	bookingHistories := make([]*types.BookingHistory, 0, len(bookings))
	for _, booking := range bookings {
		history := &types.BookingHistory{
			Id:          booking.Id,
			UserId:      booking.UserId,
			ShowtimeId:  booking.ShowtimeId,
			TotalAmount: booking.TotalAmount,
			Status:      string(booking.Status),
			StaffId:     booking.StaffId,
			BookingType: booking.BookingType,
			CreatedAt:   booking.CreatedAt,
			UpdatedAt:   booking.UpdatedAt,
		}

		if showtime, exists := showtimeMap[booking.ShowtimeId]; exists {
			history.MovieTitle = showtime.MovieTitle
			history.ShowtimeDate = showtime.ShowtimeDate
			history.ShowtimeTime = showtime.ShowtimeTime
			history.SeatNumbers = strings.Join(showtime.SeatNumbers, ", ")
		}

		bookingHistories = append(bookingHistories, history)
	}

	return bookingHistories, nil
}

func (s *BookingService) isValidStatus(status string) bool {
	switch models.BookingStatus(status) {
	case models.BookingStatusPending,
		models.BookingStatusConfirmed,
		models.BookingStatusCancelled:
		return true
	default:
		return false
	}
}

func (s *BookingService) CreateBooking(ctx context.Context, userId string, showtimeId string, seatIds []string, totalAmount int) (*models.Booking, error) {
	if userId == "" || showtimeId == "" || len(seatIds) == 0 || totalAmount <= 0 {
		return nil, ErrInvalidBookingData
	}

	seatsWithPrice, err := s.movieClient.GetSeatsWithPrice(ctx, showtimeId, seatIds)
	if err != nil {
		return nil, fmt.Errorf("failed to validate seat prices: %w", err)
	}

	for _, seat := range seatsWithPrice.Data {
		if !seat.Available {
			return nil, fmt.Errorf("seat %s (%s) is not available", seat.SeatNumber, seat.SeatId)
		}
	}

	expectedTotal := seatsWithPrice.TotalAmount
	clientTotal := float64(totalAmount)

	if clientTotal < expectedTotal-0.01 || clientTotal > expectedTotal+0.01 {
		return nil, fmt.Errorf("invalid total amount: expected %.2f, got %.2f", expectedTotal, clientTotal)
	}

	// Check if any seats are already locked in Redis
	lockedSeats, err := s.checkSeatLocks(ctx, showtimeId, seatIds)
	if err != nil {
		return nil, fmt.Errorf("failed to check seat locks: %w", err)
	}

	if len(lockedSeats) > 0 {
		var lockedInfo []string
		for seatId, lockOwner := range lockedSeats {
			lockedInfo = append(lockedInfo, fmt.Sprintf("seat %s (locked by booking %s)", seatId, lockOwner))
		}
		return nil, fmt.Errorf("%w: %s", ErrSeatAlreadyLocked, strings.Join(lockedInfo, ", "))
	}

	booking := &models.Booking{
		Id:          uuid.New().String(),
		UserId:      userId,
		ShowtimeId:  showtimeId,
		TotalAmount: expectedTotal,
		Status:      models.BookingStatusPending,
		BookingType: "online",
	}

	eventData := &models.BookingEventData{
		BookingId:   booking.Id,
		UserId:      booking.UserId,
		ShowtimeId:  booking.ShowtimeId,
		SeatIds:     seatIds,
		TotalAmount: booking.TotalAmount,
		Status:      booking.Status,
	}

	err = s.db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
		if err := datastore.CreateBooking(ctx, tx, booking); err != nil {
			return fmt.Errorf("failed to create booking: %w", err)
		}

		if err := datastore.CreateOutboxEvent(ctx, tx, models.EventTypeBookingCreated, eventData); err != nil {
			return fmt.Errorf("failed to create outbox event: %w", err)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return booking, nil
}

func (s *BookingService) GetBookingByID(ctx context.Context, bookingId string) (*models.Booking, error) {
	if bookingId == "" {
		return nil, ErrInvalidBookingData
	}

	booking, err := datastore.GetBookingById(ctx, s.roDb, bookingId)
	if err != nil {
		return nil, ErrBookingNotFound
	}

	return booking, nil
}

// checkSeatLocks checks if any of the given seats are already locked in Redis
// Returns a map of seatId -> lockOwner (booking_id) for any locked seats
func (s *BookingService) checkSeatLocks(ctx context.Context, showtimeId string, seatIds []string) (map[string]string, error) {
	lockedSeats := make(map[string]string)

	for _, seatId := range seatIds {
		lockKey := fmt.Sprintf("seat_lock:%s:%s", showtimeId, seatId)

		// Check if lock exists
		lockOwner, err := s.redisClient.Get(ctx, lockKey).Result()

		// Lock doesn't exist, seat is available
		if errors.Is(err, redis.Nil) {
			continue
		}

		// Redis error (connection issue, etc.)
		if err != nil {
			return nil, fmt.Errorf("failed to check lock for seat %s: %w", seatId, err)
		}

		// Lock exists, seat is locked by another booking
		lockedSeats[seatId] = lockOwner
	}

	return lockedSeats, nil
}

func (s *BookingService) UpdateBookingStatus(ctx context.Context, bookingId string, status string) error {
	if bookingId == "" {
		return ErrInvalidBookingData
	}

	if !s.isValidStatus(status) {
		return fmt.Errorf("invalid booking status: %s", status)
	}

	err := datastore.UpdateBookingStatus(ctx, s.db, bookingId, models.BookingStatus(status))
	if err != nil {
		return fmt.Errorf("failed to update booking status: %w", err)
	}

	// If status is confirmed, perform additional actions
	if status == string(models.BookingStatusConfirmed) {
		// Get booking details
		booking, err := datastore.GetBookingById(ctx, s.roDb, bookingId)
		if err != nil {
			return fmt.Errorf("failed to get booking: %w", err)
		}

		// Extend seat locks until movie ends
		if err := s.extendSeatLocksUntilMovieEnds(ctx, booking); err != nil {
			// Log error but don't fail the entire operation
			fmt.Printf("Failed to extend seat locks for booking %s: %v\n", bookingId, err)
		}
	}

	return nil
}

// extendSeatLocksUntilMovieEnds extends the Redis locks for seats until the movie ends
// This ensures seats remain locked for the duration of the movie
func (s *BookingService) extendSeatLocksUntilMovieEnds(ctx context.Context, booking *models.Booking) error {
	// Get seat IDs from the booking event data stored in outbox
	// We need to query the booking_created event to get the seat IDs
	var event models.OutboxEvent
	err := s.roDb.NewSelect().
		Model(&event).
		Where("event_type = ?", models.EventTypeBookingCreated).
		Where("payload::jsonb->>'booking_id' = ?", booking.Id).
		Order("id DESC").
		Limit(1).
		Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get booking event: %w", err)
	}

	var eventData models.BookingEventData
	if err := json.Unmarshal([]byte(event.Payload), &eventData); err != nil {
		return fmt.Errorf("failed to unmarshal event data: %w", err)
	}

	seatIds := eventData.SeatIds
	if len(seatIds) == 0 {
		return fmt.Errorf("no seats found for booking %s", booking.Id)
	}

	// Get showtime data to calculate when the movie ends
	showtimeData, err := s.movieClient.GetShowtime(ctx, booking.ShowtimeId)
	if err != nil {
		return fmt.Errorf("failed to get showtime data: %w", err)
	}

	// Parse showtime date and time to calculate TTL
	// Format: showtime_date = "2024-01-15", showtime_time = "14:30:00"
	showtimeStr := fmt.Sprintf("%s %s", showtimeData.ShowtimeDate, showtimeData.ShowtimeTime)
	showtimeStart, err := time.Parse("2006-01-02 15:04:05", showtimeStr)
	if err != nil {
		return fmt.Errorf("failed to parse showtime: %w", err)
	}

	// TODO: Get actual movie duration from movie-service
	// For now, assume 4 hours (240 minutes) as a safe upper bound for movie duration + buffer
	movieDuration := 4 * time.Hour
	movieEndTime := showtimeStart.Add(movieDuration)

	// Calculate TTL from now until movie ends
	ttl := time.Until(movieEndTime)
	if ttl <= 0 {
		// Movie already ended, set a minimal TTL
		ttl = 1 * time.Minute
	}

	// Extend locks for all seats
	for _, seatId := range seatIds {
		lockKey := fmt.Sprintf("seat_lock:%s:%s", booking.ShowtimeId, seatId)

		// Use EXPIRE to extend the TTL of existing lock
		err := s.redisClient.Expire(ctx, lockKey, ttl).Err()
		if err != nil {
			return fmt.Errorf("failed to extend lock for seat %s: %w", seatId, err)
		}
	}

	return nil
}
