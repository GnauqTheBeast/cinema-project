package grpc

import (
	"context"
	"fmt"

	"booking-service/proto/pb"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type MovieClient struct {
	conn   *grpc.ClientConn
	client pb.MovieServiceClient
}

func NewMovieClient(address string) (*MovieClient, error) {
	conn, err := grpc.NewClient(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to movie service: %w", err)
	}

	client := pb.NewMovieServiceClient(conn)

	return &MovieClient{
		conn:   conn,
		client: client,
	}, nil
}

func (c *MovieClient) GetShowtime(ctx context.Context, showtimeId string) (*pb.ShowtimeData, error) {
	req := &pb.GetShowtimeRequest{
		Id: showtimeId,
	}

	resp, err := c.client.GetShowtime(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get showtime: %w", err)
	}

	if !resp.Success {
		return nil, fmt.Errorf("movie service error: %s", resp.Message)
	}

	return resp.Data, nil
}

func (c *MovieClient) GetShowtimes(ctx context.Context, showtimeIds []string) ([]*pb.ShowtimeData, error) {
	req := &pb.GetShowtimesRequest{
		Ids: showtimeIds,
	}

	resp, err := c.client.GetShowtimes(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get showtimes: %w", err)
	}

	if !resp.Success {
		return nil, fmt.Errorf("movie service error: %s", resp.Message)
	}

	return resp.Data, nil
}

func (c *MovieClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
