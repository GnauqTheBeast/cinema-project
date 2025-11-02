package grpc_server

import (
	"context"
	"fmt"

	"booking-service/internal/services"
	"booking-service/proto/pb"

	"github.com/samber/do"
	"github.com/sirupsen/logrus"
)

type BookingServer struct {
	pb.UnimplementedBookingServiceServer
	bookingService *services.BookingService
}

func NewBookingServer(i *do.Injector) (*BookingServer, error) {
	bookingService, err := do.Invoke[*services.BookingService](i)
	if err != nil {
		return nil, err
	}

	return &BookingServer{
		bookingService: bookingService,
	}, nil
}

func (s *BookingServer) UpdateBookingStatus(ctx context.Context, req *pb.UpdateBookingStatusRequest) (*pb.UpdateBookingStatusResponse, error) {
	logrus.Infof("[gRPC] UpdateBookingStatus called for booking %s to status %s", req.BookingId, req.Status)

	userId, err := s.bookingService.UpdateBookingStatus(ctx, req.BookingId, req.Status)
	if err != nil {
		logrus.Errorf("[gRPC] Failed to update booking status: %v", err)
		return &pb.UpdateBookingStatusResponse{
			Success:   false,
			Message:   fmt.Sprintf("failed to update booking status: %v", err),
			UserId:    "",
			BookingId: req.BookingId,
		}, err
	}

	logrus.Infof("[gRPC] Successfully updated booking %s to status %s (user: %s)", req.BookingId, req.Status, userId)
	return &pb.UpdateBookingStatusResponse{
		Success:   true,
		Message:   "Booking status updated successfully",
		UserId:    userId,
		BookingId: req.BookingId,
	}, nil
}

func (s *BookingServer) CreateTickets(ctx context.Context, req *pb.CreateTicketsRequest) (*pb.CreateTicketsResponse, error) {
	logrus.Infof("[gRPC] CreateTickets called for booking %s", req.BookingId)

	// Use new function to get both tickets count and booking details
	bookingDetails, ticketsCreated, err := s.bookingService.CreateTicketsWithDetails(ctx, req.BookingId)
	if err != nil {
		logrus.Errorf("[gRPC] Failed to create tickets: %v", err)
		return &pb.CreateTicketsResponse{
			Success:        false,
			Message:        fmt.Sprintf("failed to create tickets: %v", err),
			TicketsCreated: 0,
			BookingDetails: nil,
		}, err
	}

	// Convert booking details to protobuf
	seats := make([]*pb.SeatInfo, 0, len(bookingDetails.Seats))
	for _, seat := range bookingDetails.Seats {
		seats = append(seats, &pb.SeatInfo{
			SeatRow:    seat.SeatRow,
			SeatNumber: int32(seat.SeatNumber),
			SeatType:   seat.SeatType,
		})
	}

	pbBookingDetails := &pb.BookingDetails{
		BookingId: bookingDetails.BookingId,
		UserEmail: bookingDetails.UserEmail,
		Seats:     seats,
		Showtime: &pb.ShowtimeInfo{
			ShowtimeId: bookingDetails.Showtime.ShowtimeId,
			StartTime:  bookingDetails.Showtime.StartTime,
			MovieName:  bookingDetails.Showtime.MovieName,
			RoomName:   bookingDetails.Showtime.RoomName,
		},
	}

	logrus.Infof("[gRPC] Successfully created %d tickets for booking %s", ticketsCreated, req.BookingId)
	return &pb.CreateTicketsResponse{
		Success:        true,
		Message:        fmt.Sprintf("Created %d tickets successfully", ticketsCreated),
		TicketsCreated: int32(ticketsCreated),
		BookingDetails: pbBookingDetails,
	}, nil
}
