package main

//
//import (
//	"fmt"
//	"github.com/samber/do"
//	"github.com/uptrace/bun"
//	"movie-service/internal/container"
//	"movie-service/internal/module/movie/repository/postgres"
//	"net"
//
//	"movie-service/internal/module/movie/business"
//	"movie-service/internal/module/movie/transport/grpc"
//
//	"github.com/urfave/cli/v2"
//	"google.golang.org/grpc"
//)
//
//func ServeGRPC() *cli.Command {
//	return &cli.Command{
//		Name:  "grpc",
//		Usage: "start the Grpc server",
//		Action: func(c *cli.Context) error {
//			s := grpc.NewServer()
//
//			i := container.NewContainer()
//
//			repo, _ := postgres.NewMovieRepository(i)
//			biz, _ := business.NewBusiness(i)
//			tourRpcService := grpc.NewTourServiceServer()
//
//			pb.RegisterTourServiceServer(s, tourRpcService)
//
//			lis, err := net.Listen("tcp", ":50051")
//			if err != nil {
//				return err
//			}
//
//			fmt.Println("movie service listening on port 50051")
//			return s.Serve(lis)
//		},
//	}
//}
