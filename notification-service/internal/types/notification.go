package types

import "notification-service/internal/models"

type GetNotificationsResponse struct {
	Notifications []*models.Notification `json:"notifications"`
	Total         int                    `json:"total"`
}
