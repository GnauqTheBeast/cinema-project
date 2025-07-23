package main

import (
	"github.com/sirupsen/logrus"
	"movie-service/internal/container"
	"movie-service/internal/module/movie/transport/rest"
	"movie-service/middleware"

	"github.com/gin-gonic/gin"
	"github.com/urfave/cli/v2"
)

func ServeAPI() *cli.Command {
	return &cli.Command{
		Name:  "serve",
		Usage: "start the API server",
		Action: func(c *cli.Context) error {
			router := gin.Default()
			router.RedirectTrailingSlash = true
			gin.SetMode(gin.DebugMode)
			router.Use(middleware.Cors())

			logrus.Printf("ListenAndServe: %s\n", "8083")
			startRouteV1(router.Group("/api/v1"))

			return router.Run(":8083")
		},
	}
}

type Handler interface {
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
