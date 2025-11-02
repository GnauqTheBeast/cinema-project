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

	err := s.bookingService.UpdateBookingStatus(ctx, req.BookingId, req.Status)
	if err != nil {
		logrus.Errorf("[gRPC] Failed to update booking status: %v", err)
		return &pb.UpdateBookingStatusResponse{
			Success: false,
			Message: fmt.Sprintf("failed to update booking status: %v", err),
		}, err
	}

	logrus.Infof("[gRPC] Successfully updated booking %s to status %s", req.BookingId, req.Status)
	return &pb.UpdateBookingStatusResponse{
		Success: true,
		Message: "Booking status updated successfully",
	}, nil
}
