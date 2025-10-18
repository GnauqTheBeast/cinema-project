package grpc

import (
	"context"
	"fmt"

	"movie-service/internal/module/showtime/entity"
	"movie-service/proto/pb"

	"google.golang.org/grpc"
)

type Business interface {
	GetShowtimeById(ctx context.Context, id string) (*entity.Showtime, error)
	GetShowtimesByIds(ctx context.Context, ids []string) ([]*entity.Showtime, error)
}

type MovieServiceServer struct {
	pb.UnimplementedMovieServiceServer
	business Business
}

func NewMovieGRPCServer(business Business) *MovieServiceServer {
	return &MovieServiceServer{
		business: business,
	}
}

func (s *MovieServiceServer) GetShowtime(ctx context.Context, req *pb.GetShowtimeRequest) (*pb.GetShowtimeResponse, error) {
	showtime, err := s.business.GetShowtimeById(ctx, req.Id)
	if err != nil {
		return &pb.GetShowtimeResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to get showtime: %v", err),
		}, nil
	}

	showtimeData := &pb.ShowtimeData{
		Id:           showtime.Id,
		MovieId:      showtime.MovieId,
		RoomId:       showtime.RoomId,
		ShowtimeDate: showtime.StartTime.Format("2006-01-02"),
		ShowtimeTime: showtime.StartTime.Format("15:04:05"),
		MovieTitle:   showtime.Movie.Title,
		RoomNumber:   fmt.Sprintf("%d", showtime.Room.RoomNumber),
		SeatNumbers:  []string{}, // Empty for now
	}

	return &pb.GetShowtimeResponse{
		Success: true,
		Message: "Showtime retrieved successfully",
		Data:    showtimeData,
	}, nil
}

func (s *MovieServiceServer) GetShowtimes(ctx context.Context, req *pb.GetShowtimesRequest) (*pb.GetShowtimesResponse, error) {
	showtimes, err := s.business.GetShowtimesByIds(ctx, req.Ids)
	if err != nil {
		return &pb.GetShowtimesResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to get showtimes: %v", err),
		}, nil
	}

	var showtimeData []*pb.ShowtimeData
	for _, showtime := range showtimes {
		data := &pb.ShowtimeData{
			Id:           showtime.Id,
			MovieId:      showtime.MovieId,
			RoomId:       showtime.RoomId,
			ShowtimeDate: showtime.StartTime.Format("2006-01-02"),
			ShowtimeTime: showtime.StartTime.Format("15:04:05"),
			MovieTitle:   showtime.Movie.Title,
			RoomNumber:   fmt.Sprintf("%d", showtime.Room.RoomNumber),
			SeatNumbers:  []string{}, // Empty for now
		}
		showtimeData = append(showtimeData, data)
	}

	return &pb.GetShowtimesResponse{
		Success: true,
		Message: "Showtimes retrieved successfully",
		Data:    showtimeData,
	}, nil
}

func RegisterMovieServiceServer(s *grpc.Server, business Business) {
	pb.RegisterMovieServiceServer(s, NewMovieGRPCServer(business))
}
