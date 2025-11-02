package models

import (
	"github.com/uptrace/bun"
	"time"
)

type TicketStatus string

const (
	TicketStatusUnused TicketStatus = "UNUSED"
	TicketStatusUsed   TicketStatus = "USED"
)

type Ticket struct {
	bun.BaseModel `bun:"table:tickets,alias:t"`

	Id        string       `bun:"id,pk" json:"id"`
	BookingId string       `bun:"booking_id,notnull" json:"booking_id"`
	SeatId    string       `bun:"seat_id,notnull" json:"seat_id"`
	Status    TicketStatus `bun:"status,default:'UNUSED'" json:"status"`
	CreatedAt time.Time    `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt *time.Time   `bun:"updated_at" json:"updated_at,omitempty"`

	Booking *Booking `bun:"rel:belongs-to,join:booking_id=id" json:"booking,omitempty"`
}
