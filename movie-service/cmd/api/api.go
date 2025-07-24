package main

import (
	"movie-service/internal/container"
	"movie-service/internal/module/movie/transport/rest"
	"movie-service/middleware"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
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
	GetMovies(c *gin.Context)
	GetMovieById(c *gin.Context)
	CreateMovie(c *gin.Context)
	UpdateMovie(c *gin.Context)
	DeleteMovie(c *gin.Context)
	UpdateMovieStatus(c *gin.Context)
	GetMovieStats(c *gin.Context)
	HelloWorld(c *gin.Context)
}

func startRouteV1(group *gin.RouterGroup) {
	i := container.NewContainer()

	movieApi, err := rest.NewAPI(i)
	if err != nil {
		panic(err)
	}

	movies := group.Group("/movies")
	{
		movies.GET("", movieApi.GetMovies)                      // GET /api/v1/movies
		movies.POST("", movieApi.CreateMovie)                   // POST /api/v1/movies
		movies.GET("/stats", movieApi.GetMovieStats)            // GET /api/v1/movies/stats
		movies.GET("/:id", movieApi.GetMovieById)               // GET /api/v1/movies/{id}
		movies.PUT("/:id", movieApi.UpdateMovie)                // PUT /api/v1/movies/{id}
		movies.DELETE("/:id", movieApi.DeleteMovie)             // DELETE /api/v1/movies/{id}
		movies.PATCH("/:id/status", movieApi.UpdateMovieStatus) // PATCH /api/v1/movies/{id}/status
	}

	group.GET("/health", movieApi.HelloWorld)
}
