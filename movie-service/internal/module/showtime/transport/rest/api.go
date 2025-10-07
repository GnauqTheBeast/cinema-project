package rest

import (
	"errors"
	"fmt"
	"time"

	"movie-service/internal/module/showtime/business"
	"movie-service/internal/module/showtime/entity"
	"movie-service/internal/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/samber/do"
)

type handler struct {
	biz business.ShowtimeBiz
}

func NewAPI(i *do.Injector) (*handler, error) {
	biz, err := do.Invoke[business.ShowtimeBiz](i)
	if err != nil {
		return nil, err
	}

	return &handler{
		biz: biz,
	}, nil
}

func (h *handler) GetShowtimes(c *gin.Context) {
	var query entity.GetShowtimesQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, fmt.Sprintf("Invalid query parameters: %s", err.Error()))
		return
	}

	if query.Page == 0 {
		query.Page = 1
	}
	if query.Size == 0 {
		query.Size = 10
	}

	var dateFrom, dateTo *time.Time
	if query.DateFrom != "" {
		if parsed, err := time.Parse("2006-01-02", query.DateFrom); err == nil {
			dateFrom = &parsed
		} else {
			response.BadRequest(c, "Invalid date_from format, use YYYY-MM-DD")
			return
		}
	}

	if query.DateTo != "" {
		if parsed, err := time.Parse("2006-01-02", query.DateTo); err == nil {
			dateTo = &parsed
		} else {
			response.BadRequest(c, "Invalid date_to format, use YYYY-MM-DD")
			return
		}
	}

	showtimes, total, err := h.biz.GetShowtimes(c.Request.Context(), query.Page, query.Size, query.Search, query.MovieId, query.RoomId, query.Format, query.Status, dateFrom, dateTo)
	if err != nil {
		response.ErrorWithMessage(c, "Failed to get showtimes")
		return
	}

	resp := entity.ToShowtimesResponse(showtimes, query.Page, query.Size, total)
	response.Success(c, resp)
}

func (h *handler) GetShowtimeById(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "Showtime ID is required")
		return
	}

	showtime, err := h.biz.GetShowtimeById(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, business.ErrShowtimeNotFound) {
			response.NotFound(c, fmt.Errorf("showtime not found"))
			return
		}

		response.ErrorWithMessage(c, "Failed to get showtime")
		return
	}

	resp := entity.ToShowtimeResponse(showtime)
	response.Success(c, resp)
}

func (h *handler) GetShowtimesByMovie(c *gin.Context) {
	movieId := c.Param("id")
	if movieId == "" {
		response.BadRequest(c, "Movie ID is required")
		return
	}

	showtimes, err := h.biz.GetShowtimesByMovie(c.Request.Context(), movieId)
	if err != nil {
		response.ErrorWithMessage(c, "Failed to get showtimes by movie")
		return
	}

	responses := make([]*entity.ShowtimeResponse, len(showtimes))
	for i, showtime := range showtimes {
		responses[i] = entity.ToShowtimeResponse(showtime)
	}

	response.Success(c, map[string]interface{}{
		"data": responses,
	})
}

func (h *handler) GetShowtimesByRoom(c *gin.Context) {
	roomId := c.Param("id")
	if roomId == "" {
		response.BadRequest(c, "Room ID is required")
		return
	}

	dateStr := c.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		response.BadRequest(c, "Invalid date format, use YYYY-MM-DD")
		return
	}

	showtimes, err := h.biz.GetShowtimesByRoom(c.Request.Context(), roomId, date)
	if err != nil {
		response.ErrorWithMessage(c, "Failed to get showtimes by room")
		return
	}

	responses := make([]*entity.ShowtimeResponse, len(showtimes))
	for i, showtime := range showtimes {
		responses[i] = entity.ToShowtimeResponse(showtime)
	}

	response.Success(c, map[string]interface{}{
		"data": responses,
	})
}

func (h *handler) GetUpcomingShowtimes(c *gin.Context) {
	limit := 10
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsed, err := time.Parse("2006-01-02", limitStr); err == nil {
			limit = int(parsed.Unix())
		}
	}

	showtimes, err := h.biz.GetUpcomingShowtimes(c.Request.Context(), limit)
	if err != nil {
		response.ErrorWithMessage(c, "Failed to get upcoming showtimes")
		return
	}

	responses := make([]*entity.ShowtimeResponse, len(showtimes))
	for i, showtime := range showtimes {
		responses[i] = entity.ToShowtimeResponse(showtime)
	}

	response.Success(c, map[string]interface{}{
		"data": responses,
	})
}

func (h *handler) CreateShowtime(c *gin.Context) {
	var req entity.CreateShowtimeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, fmt.Sprintf("Invalid request body: %s", err.Error()))
		return
	}

	if !req.IsValid() {
		response.BadRequest(c, "Invalid showtime data")
		return
	}

	showtime := req.ToShowtime()
	if err := h.biz.CreateShowtime(c.Request.Context(), showtime); err != nil {
		if errors.Is(err, business.ErrTimeConflict) {
			response.BadRequest(c, "Showtime conflicts with existing schedule")
			return
		}
		if errors.Is(err, business.ErrShowtimeInPast) {
			response.BadRequest(c, "Cannot schedule showtime in the past")
			return
		}

		response.ErrorWithMessage(c, "Failed to create showtime")
		return
	}

	resp := entity.ToShowtimeResponse(showtime)
	response.Created(c, resp)
}

func (h *handler) UpdateShowtime(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "Showtime ID is required")
		return
	}

	var req entity.UpdateShowtimeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, fmt.Sprintf("Invalid request body: %s", err.Error()))
		return
	}

	if err := h.biz.UpdateShowtime(c.Request.Context(), id, &req); err != nil {
		if errors.Is(err, business.ErrShowtimeNotFound) {
			response.NotFound(c, fmt.Errorf("showtime not found"))
			return
		}
		if errors.Is(err, business.ErrTimeConflict) {
			response.BadRequest(c, "Showtime conflicts with existing schedule")
			return
		}
		if errors.Is(err, business.ErrInvalidStatusTransition) {
			response.BadRequest(c, "Invalid status transition")
			return
		}
		if errors.Is(err, business.ErrShowtimeInPast) {
			response.BadRequest(c, "Cannot schedule showtime in the past")
			return
		}

		response.ErrorWithMessage(c, "Failed to update showtime")
		return
	}

	showtime, err := h.biz.GetShowtimeById(c.Request.Context(), id)
	if err != nil {
		response.ErrorWithMessage(c, "Failed to get updated showtime")
		return
	}

	resp := entity.ToShowtimeResponse(showtime)
	response.Success(c, resp)
}

func (h *handler) DeleteShowtime(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "Showtime ID is required")
		return
	}

	if err := h.biz.DeleteShowtime(c.Request.Context(), id); err != nil {
		response.ErrorWithMessage(c, "Failed to delete showtime")
		return
	}

	response.NoContent(c)
}

func (h *handler) UpdateShowtimeStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.BadRequest(c, "Showtime ID is required")
		return
	}

	var req struct {
		Status entity.ShowtimeStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, fmt.Sprintf("Invalid request body: %s", err.Error()))
		return
	}

	if err := h.biz.UpdateShowtimeStatus(c.Request.Context(), id, req.Status); err != nil {
		if errors.Is(err, business.ErrShowtimeNotFound) {
			response.NotFound(c, fmt.Errorf("showtime not found"))
			return
		}
		if errors.Is(err, business.ErrInvalidStatusTransition) {
			response.BadRequest(c, "Invalid status transition")
			return
		}

		response.ErrorWithMessage(c, "Failed to update showtime status")
		return
	}

	showtime, err := h.biz.GetShowtimeById(c.Request.Context(), id)
	if err != nil {
		response.ErrorWithMessage(c, "Failed to get updated showtime")
		return
	}

	resp := entity.ToShowtimeResponse(showtime)
	response.Success(c, resp)
}

func (h *handler) CheckTimeConflict(c *gin.Context) {
	roomId := c.Query("room_id")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")
	excludeId := c.Query("exclude_id")

	if roomId == "" || startTimeStr == "" || endTimeStr == "" {
		response.BadRequest(c, "room_id, start_time, and end_time are required")
		return
	}

	startTime, err := time.Parse(time.RFC3339, startTimeStr)
	if err != nil {
		response.BadRequest(c, "Invalid start_time format, use RFC3339")
		return
	}

	endTime, err := time.Parse(time.RFC3339, endTimeStr)
	if err != nil {
		response.BadRequest(c, "Invalid end_time format, use RFC3339")
		return
	}

	hasConflict, err := h.biz.CheckTimeConflict(c.Request.Context(), roomId, startTime, endTime, excludeId)
	if err != nil {
		response.ErrorWithMessage(c, "Failed to check time conflict")
		return
	}

	response.Success(c, map[string]interface{}{
		"has_conflict": hasConflict,
	})
}
