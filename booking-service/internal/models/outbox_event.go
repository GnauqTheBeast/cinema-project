package models

import (
	"time"

	"github.com/uptrace/bun"
)

type OutboxEvent struct {
	bun.BaseModel `bun:"table:outbox_events"`

	ID        int               `bun:"id,pk,autoincrement" json:"id"`
	EventType OutboxEventType   `bun:"event_type,notnull" json:"event_type"`
	Payload   string            `bun:"payload,notnull" json:"payload"`
	Status    OutboxEventStatus `bun:"status,notnull,default:'pending'" json:"status"`
	CreatedAt time.Time         `bun:"created_at,notnull,default:now()" json:"created_at"`
	UpdatedAt time.Time         `bun:"updated_at,notnull,default:now()" json:"updated_at"`
}

type OutboxEventStatus string

const (
	OutboxStatusPending OutboxEventStatus = "pending"
	OutboxStatusSent    OutboxEventStatus = "sent"
	OutboxStatusFailed  OutboxEventStatus = "failed"
)

type OutboxEventType string

const (
	EventTypeBookingCreated   OutboxEventType = "BookingCreated"
	EventTypePaymentCompleted OutboxEventType = "PaymentCompleted"
	EventTypeSeatReserved     OutboxEventType = "SeatReserved"
	EventTypeSeatReleased     OutboxEventType = "SeatReleased"
	EventTypeNotificationSent OutboxEventType = "NotificationSent"
)
