package main

//
//import (
//	"log"
//	"os"
//
//	"movie-service/internal/module/movie/repository/rpc"
//
//	"google.golang.org/grpc"
//	"google.golang.org/grpc/credentials/insecure"
//)
//
//func authGrpcClient() *rpc.AuthRpcClient {
//	authGrpcServer := os.Getenv("AUTH_RPC")
//	if authGrpcServer == "" {
//		authGrpcServer = "localhost:50052" // Default to localhost if not set
//	}
//	conn, err := grpc.NewClient(authGrpcServer, grpc.WithTransportCredentials(insecure.NewCredentials()))
//	if err != nil {
//		log.Println(err)
//		return nil
//	}
//	return rpc.NewClient(pb.NewAuthServiceClient(conn))
//}
