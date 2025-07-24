package rest

import (
	"errors"
	"fmt"

	"movie-service/internal/module/movie/business"
	"movie-service/internal/module/movie/entity"

	"github.com/gin-gonic/gin"
	"github.com/samber/do"
)

type handler struct {
	biz business.MovieBiz
}

func NewAPI(i *do.Injector) (*handler, error) {
	biz, err := do.Invoke[business.MovieBiz](i)
	if err != nil {
		return nil, err
	}

	return &handler{
		biz: biz,
	}, nil
}

func (h *handler) GetMovies(c *gin.Context) {
	var query GetMoviesQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		responseBadRequest(c, fmt.Sprintf("Invalid query parameters: %s", err.Error()))
		return
	}

	if query.Page == 0 {
		query.Page = 1
	}
	if query.Size == 0 {
		query.Size = 10
	}

	movies, total, err := h.biz.GetMovies(c.Request.Context(), query.Page, query.Size)
	if err != nil {
		responseErrorWithMessage(c, "Failed to get movies")
		return
	}

	response := ToMoviesResponse(movies, query.Page, query.Size, total)
	responseSuccess(c, response)
}

func (h *handler) GetMovieById(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		responseBadRequest(c, "Movie ID is required")
		return
	}

	movie, err := h.biz.GetMovieById(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, business.ErrMovieNotFound) {
			responseNotFound(c, fmt.Errorf("movie not found"))
			return
		}

		responseErrorWithMessage(c, "Failed to get movie")
		return
	}

	response := ToMovieResponse(movie)
	responseSuccess(c, response)
}

func (h *handler) CreateMovie(c *gin.Context) {
	var req CreateMovieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responseBadRequest(c, fmt.Sprintf("Invalid request body: %s", err.Error()))
		return
	}

	movie := req.ToEntity()
	err := h.biz.CreateMovie(c.Request.Context(), movie)
	if err != nil {
		if errors.Is(err, business.ErrInvalidMovieData) {
			responseBadRequest(c, "Invalid movie data provided")
			return
		}

		responseErrorWithMessage(c, "Failed to create movie")
		return
	}

	response := ToMovieResponse(movie)
	responseCreated(c, response)
}

func (h *handler) UpdateMovie(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		responseBadRequest(c, "Movie ID is required")
		return
	}

	var req UpdateMovieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responseBadRequest(c, fmt.Sprintf("Invalid request body: %s", err.Error()))
		return
	}

	movie := req.ToEntity(id)
	err := h.biz.UpdateMovie(c.Request.Context(), movie)
	if err != nil {
		if errors.Is(err, business.ErrMovieNotFound) {
			responseNotFound(c, fmt.Errorf("movie not found"))
			return
		}

		if errors.Is(err, business.ErrInvalidMovieData) {
			responseBadRequest(c, "Invalid movie data provided")
			return
		}

		if errors.Is(err, business.ErrInvalidStatusTransition) {
			responseBadRequest(c, "Invalid status transition")
			return
		}

		responseErrorWithMessage(c, "Failed to update movie")
		return
	}

	response := ToMovieResponse(movie)
	responseSuccess(c, response)
}

func (h *handler) DeleteMovie(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		responseBadRequest(c, "Movie ID is required")
		return
	}

	err := h.biz.DeleteMovie(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, business.ErrMovieNotFound) {
			responseNotFound(c, fmt.Errorf("movie not found"))
			return
		}

		responseErrorWithMessage(c, "Failed to delete movie")
		return
	}

	responseSuccessWithMessage(c, "Movie deleted successfully")
}

func (h *handler) UpdateMovieStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		responseBadRequest(c, "Movie ID is required")
		return
	}

	var req UpdateMovieStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		responseBadRequest(c, fmt.Sprintf("Invalid request body: %s", err.Error()))
		return
	}

	status := entity.MovieStatus(req.Status)
	err := h.biz.UpdateMovieStatus(c.Request.Context(), id, status)
	if err != nil {
		if errors.Is(err, business.ErrMovieNotFound) {
			responseNotFound(c, fmt.Errorf("movie not found"))
			return
		}

		if errors.Is(err, business.ErrInvalidStatusTransition) {
			responseBadRequest(c, "Invalid status transition")
			return
		}

		responseErrorWithMessage(c, "Failed to update movie status")
		return
	}

	movie, err := h.biz.GetMovieById(c.Request.Context(), id)
	if err != nil {
		responseErrorWithMessage(c, "Failed to get updated movie")
		return
	}

	response := ToMovieResponse(movie)
	responseSuccess(c, response)
}

func (h *handler) HelloWorld(c *gin.Context) {
	data := gin.H{
		"message": "Hello World from Movie Service",
		"service": "movie-service",
		"version": "1.0.0",
	}
	responseSuccess(c, data)
}

func (h *handler) GetMovieStats(c *gin.Context) {
	allMovies, _, err := h.biz.GetMovies(c.Request.Context(), 1, 1000)
	if err != nil {
		responseErrorWithMessage(c, "Failed to get movie statistics")
		return
	}

	stats := map[string]interface{}{
		"total":    len(allMovies),
		"upcoming": 0,
		"showing":  0,
		"ended":    0,
	}

	for _, movie := range allMovies {
		switch movie.Status {
		case entity.MovieStatusUpcoming:
			stats["upcoming"] = stats["upcoming"].(int) + 1
		case entity.MovieStatusShowing:
			stats["showing"] = stats["showing"].(int) + 1
		case entity.MovieStatusEnded:
			stats["ended"] = stats["ended"].(int) + 1
		}
	}

	responseSuccess(c, stats)
}
