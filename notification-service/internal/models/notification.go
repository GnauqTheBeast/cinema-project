package models

import "time"

type NotificationStatus string

const (
	NotificationStatusPending NotificationStatus = "pending"
	NotificationStatusSent    NotificationStatus = "sent"
	NotificationStatusFailed  NotificationStatus = "failed"
	NotificationStatusRead    NotificationStatus = "read"
	NotificationStatusDeleted NotificationStatus = "deleted"
)

type NotificationTitle string

const (
	NotificationForgotPassword NotificationTitle = "Forgot Password"
	NotificationEmailVerified  NotificationTitle = "Email Verified"
)

type Notification struct {
	Id        string             `bun:"id,pk" json:"id"`
	UserId    string             `bun:"user_id" json:"user_id"`
	Title     NotificationTitle  `bun:"title" json:"title"`
	Content   string             `bun:"content" json:"content"`
	Status    NotificationStatus `bun:"status,default:'pending'" json:"status"`
	CreatedAt *time.Time         `bun:"created_at,default:current_timestamp" json:"created_at"`
	UpdatedAt *time.Time         `bun:"updated_at,default:current_timestamp" json:"updated_at"`
}
