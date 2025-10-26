package handlers

import (
	"errors"
	"fmt"

	"booking-service/internal/pkg/response"
	"booking-service/internal/services"

	"github.com/labstack/echo/v4"
	"github.com/samber/do"
)

type BookingHandler struct {
	container *do.Injector
}

func NewBookingHandler(i *do.Injector) (*BookingHandler, error) {
	return &BookingHandler{
		container: i,
	}, nil
}

func (h *BookingHandler) GetBookings(c echo.Context) error {
	bookingService, err := do.Invoke[*services.BookingService](h.container)
	if err != nil {
		return response.InternalServerError(c, "Failed to get booking service")
	}

	var query struct {
		Page   int    `query:"page"`
		Size   int    `query:"size"`
		Status string `query:"status"`
	}
	if err := c.Bind(&query); err != nil {
		return response.BadRequest(c, fmt.Sprintf("Invalid query parameters: %s", err.Error()))
	}

	userId := c.Get("user_id").(string)
	if userId == "" {
		return response.Unauthorized(c, "User ID not found in token")
	}

	if query.Page == 0 {
		query.Page = 1
	}
	if query.Size == 0 {
		query.Size = 10
	}

	bookings, total, err := bookingService.GetUserBookings(c.Request().Context(), userId, query.Page, query.Size, query.Status)
	if err != nil {
		if errors.Is(err, services.ErrInvalidBookingData) {
			return response.BadRequest(c, "Invalid request data")
		}
		return response.ErrorWithMessage(c, "Failed to get bookings")
	}

	responseData := map[string]interface{}{
		"bookings": bookings,
		"total":    total,
		"page":     query.Page,
		"size":     query.Size,
	}

	return response.SuccessWithMessage(c, "Bookings fetched successfully", responseData)
}

func (h *BookingHandler) CreateBooking(c echo.Context) error {
	bookingService, err := do.Invoke[*services.BookingService](h.container)
	if err != nil {
		return response.InternalServerError(c, "Failed to get booking service")
	}

	var request struct {
		ShowtimeId  string   `json:"showtime_id" validate:"required,uuid"`
		SeatIds     []string `json:"seat_ids" validate:"required,dive,uuid"`
		TotalAmount int      `json:"total_amount" validate:"required,min=1"`
	}

	if err := c.Bind(&request); err != nil {
		return response.BadRequest(c, "Invalid request data")
	}

	userId := c.Get("user_id").(string)
	if userId == "" {
		return response.Unauthorized(c, "User ID not found in token")
	}

	booking, err := bookingService.CreateBooking(c.Request().Context(), userId, request.ShowtimeId, request.SeatIds, request.TotalAmount)
	if err != nil {
		if errors.Is(err, services.ErrInvalidBookingData) {
			return response.BadRequest(c, "Invalid booking data")
		}
		return response.ErrorWithMessage(c, "Failed to create booking")
	}

	return response.SuccessWithMessage(c, "Booking created successfully", booking)
}
