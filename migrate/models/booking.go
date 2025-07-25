package models

import (
	"time"

	"github.com/uptrace/bun"
)

type Booking struct {
	bun.BaseModel `bun:"table:bookings,alias:b"`

	Id          string     `bun:"id,pk" json:"id"`
	CustomerId  string     `bun:"customer_id,notnull" json:"customer_id"`
	ShowtimeId  string     `bun:"showtime_id,notnull" json:"showtime_id"`
	TotalAmount float64    `bun:"total_amount,notnull,type:decimal(10,2)" json:"total_amount"`
	Status      string     `bun:"status,notnull,default:'pending'" json:"status"`
	StaffId     string     `bun:"staff_id" json:"staff_id,omitempty"`
	BookingType string     `bun:"booking_type,notnull" json:"booking_type"`
	CreatedAt   time.Time  `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt   *time.Time `bun:"updated_at" json:"updated_at,omitempty"`

	Customer *User     `bun:"rel:belongs-to,join:customer_id=id" json:"customer,omitempty"`
	Staff    *User     `bun:"rel:belongs-to,join:staff_id=id" json:"staff,omitempty"`
	Showtime *Showtime `bun:"rel:belongs-to,join:showtime_id=id" json:"showtime,omitempty"`
	Tickets  []*Ticket `bun:"rel:has-many,join:id=booking_id" json:"tickets,omitempty"`
	Payments *Payment  `bun:"rel:belongs-to,join:id=booking_id" json:"payments,omitempty"`
}
