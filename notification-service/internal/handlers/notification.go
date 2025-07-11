package handlers

import (
	"net/http"
	"strconv"

	"notification-service/internal/services"
	"notification-service/internal/types"

	"github.com/labstack/echo/v4"
	"github.com/samber/do"
)

type groupNotification struct {
	container *do.Injector
}

func (gn *groupNotification) GetNotifications(c echo.Context) error {
	notiService, err := do.Invoke[*services.NotificationService](gn.container)
	if err != nil {
		return err
	}

	userId := c.Param("userId")
	if userId == "" {
		return c.JSON(http.StatusBadRequest, "userId is required")
	}

	page := 1
	size := 5

	if pageStr := c.QueryParam("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if sizeStr := c.QueryParam("size"); sizeStr != "" {
		if s, err := strconv.Atoi(sizeStr); err == nil && s > 0 {
			size = s
		}
	}

	limit := size
	offset := (page - 1) * size

	ctx := c.Request().Context()
	notifications, err := notiService.GetUserNotifications(ctx, userId, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	return types.ResponseWithMessage(c, &types.Body{
		Code:    http.StatusOK,
		Message: "Notifications fetched successfully",
		Data:    notifications,
	})
}
