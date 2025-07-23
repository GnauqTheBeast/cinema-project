package grpc

import "movie-service/proto/pb"

type Business interface{}

type MovieServiceServer struct {
	pb.UnimplementedAuthServiceServer
	business Business
}

func NewMovieGRPCServer(business Business) *MovieServiceServer {
	return &MovieServiceServer{
		business: business,
	}
}
