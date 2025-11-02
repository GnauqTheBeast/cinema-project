package grpc

import (
	"context"
	"fmt"
	"os"

	"worker-service/proto/pb"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type BookingClient struct {
	conn   *grpc.ClientConn
	client pb.BookingServiceClient
}

func NewBookingClient() (*BookingClient, error) {
	bookingServiceURL := os.Getenv("BOOKING_SERVICE_GRPC_URL")
	if bookingServiceURL == "" {
		bookingServiceURL = "booking-service:50082"
	}

	conn, err := grpc.NewClient(
		bookingServiceURL,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to booking service: %w", err)
	}

	client := pb.NewBookingServiceClient(conn)

	return &BookingClient{
		conn:   conn,
		client: client,
	}, nil
}

func (c *BookingClient) UpdateBookingStatus(ctx context.Context, bookingId string, status string) error {
	req := &pb.UpdateBookingStatusRequest{
		BookingId: bookingId,
		Status:    status,
	}

	resp, err := c.client.UpdateBookingStatus(ctx, req)
	if err != nil {
		return fmt.Errorf("failed to update booking status via gRPC: %w", err)
	}

	if !resp.Success {
		return fmt.Errorf("update booking status failed: %s", resp.Message)
	}

	return nil
}

func (c *BookingClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
