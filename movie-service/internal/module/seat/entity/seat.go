package entity

import (
	"time"

	"github.com/uptrace/bun"
)

type SeatStatus string

const (
	SeatStatusAvailable   SeatStatus = "available"
	SeatStatusOccupied    SeatStatus = "occupied"
	SeatStatusMaintenance SeatStatus = "maintenance"
	SeatStatusBlocked     SeatStatus = "blocked"
)

type SeatType string

const (
	SeatTypeRegular SeatType = "regular"
	SeatTypeVIP     SeatType = "vip"
	SeatTypeCouple  SeatType = "couple"
)

type Seat struct {
	bun.BaseModel `bun:"table:seats,alias:s"`

	Id         string     `bun:"id,pk" json:"id"`
	RoomId     string     `bun:"room_id,notnull" json:"room_id"`
	SeatNumber string     `bun:"seat_number,notnull" json:"seat_number"`
	RowNumber  string     `bun:"row_number,notnull" json:"row_number"`
	SeatType   SeatType   `bun:"seat_type,notnull,default:'regular'" json:"seat_type"`
	Status     SeatStatus `bun:"status,notnull,default:'available'" json:"status"`
	CreatedAt  time.Time  `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt  *time.Time `bun:"updated_at" json:"updated_at,omitempty"`
}

func (s *Seat) IsValid() bool {
	if s.RoomId == "" || s.SeatNumber == "" || s.RowNumber == "" {
		return false
	}
	return true
}

func (s *Seat) CanChangeStatus(newStatus SeatStatus) bool {
	switch s.Status {
	case SeatStatusAvailable:
		return newStatus == SeatStatusOccupied || newStatus == SeatStatusMaintenance || newStatus == SeatStatusBlocked
	case SeatStatusOccupied:
		return newStatus == SeatStatusAvailable
	case SeatStatusMaintenance:
		return newStatus == SeatStatusAvailable
	case SeatStatusBlocked:
		return newStatus == SeatStatusAvailable
	default:
		return false
	}
}

type SeatsDetail struct {
	Seats       []*Seat `json:"seats"`
	LockedSeats []*Seat `json:"locked_seats"`
}

func GetSeatTypePriceMultiplier(seatType SeatType) float64 {
	switch seatType {
	case SeatTypeRegular:
		return 1.0
	case SeatTypeVIP:
		return 1.5
	case SeatTypeCouple:
		return 2.5
	default:
		return 1.0
	}
}

func (s *Seat) CalculatePrice(basePrice float64) float64 {
	return basePrice * GetSeatTypePriceMultiplier(s.SeatType)
}
