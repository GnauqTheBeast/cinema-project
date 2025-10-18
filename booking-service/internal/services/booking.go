package services

import (
	"context"
	"fmt"
	"strings"

	"booking-service/internal/datastore"
	"booking-service/internal/grpc"
	"booking-service/internal/models"
	"booking-service/internal/types"
	"booking-service/proto/pb"

	"github.com/samber/do"
	"github.com/uptrace/bun"
)

var (
	ErrInvalidBookingData = fmt.Errorf("invalid booking data")
	ErrBookingNotFound    = fmt.Errorf("booking not found")
	ErrUnauthorized       = fmt.Errorf("unauthorized access")
)

type BookingService struct {
	container   *do.Injector
	db          *bun.DB
	roDb        *bun.DB
	movieClient *grpc.MovieClient
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

	movieClient, err := grpc.NewMovieClient("localhost:50053")
	fmt.Println("movieClient", movieClient, err)
	if err != nil {
		return nil, fmt.Errorf("failed to create movie client: %w", err)
	}

	return &BookingService{
		container:   container,
		db:          db,
		roDb:        roDb,
		movieClient: movieClient,
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
	fmt.Println("showtimes", showtimes, err)
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
			Status:      booking.Status,
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
