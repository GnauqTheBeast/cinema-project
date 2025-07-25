package grpc

import "movie-service/proto/pb"

type Business interface{}

type MovieServiceServer struct {
	// TODO: embed movie service server, not auth service server
	pb.UnimplementedAuthServiceServer
	business Business
}

func NewMovieGRPCServer(business Business) *MovieServiceServer {
	return &MovieServiceServer{
		business: business,
	}
}
