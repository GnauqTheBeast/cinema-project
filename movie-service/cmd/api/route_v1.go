package main

import (
	"github.com/gin-gonic/gin"
	"movie-service/internal/container"
	"movie-service/internal/module/movie/transport/rest"
)

type API interface {
	HelloWorld(c *gin.Context)
}

func startRouteV1(group *gin.RouterGroup) {
	i := container.NewContainer()

	movieApi, _ := rest.NewAPI(i)

	movies := group.Group("/movies")
	{
		movies.GET("", movieApi.HelloWorld)
	}
}
