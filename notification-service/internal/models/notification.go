package models

import "time"

type NotificationStatus string

const (
	NotificationStatusPending NotificationStatus = "pending"
	NotificationStatusSent    NotificationStatus = "sent"
	NotificationStatusFailed  NotificationStatus = "failed"
	NotificationStatusRead    NotificationStatus = "read"
)

type Notification struct {
	Id        string             `bun:"id,pk,type:uuid"`
	UserId    string             `bun:"user_id,type:uuid"`
	Title     string             `bun:"title,type:text"`
	Content   string             `bun:"content,type:text"`
	Status    NotificationStatus `bun:"status"`
	CreatedAt *time.Time         `bun:"created_at,default:current_timestamp"`
	UpdatedAt *time.Time         `bun:"updated_at,default:current_timestamp"`
}
