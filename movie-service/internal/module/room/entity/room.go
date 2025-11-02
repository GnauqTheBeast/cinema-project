package entity

import (
	"time"

	"github.com/uptrace/bun"
)

type RoomStatus string

const (
	RoomStatusActive      RoomStatus = "active"
	RoomStatusInactive    RoomStatus = "inactive"
	RoomStatusMaintenance RoomStatus = "maintenance"
)

type RoomType string

const (
	RoomTypeStandard RoomType = "standard"
	RoomTypeVIP      RoomType = "vip"
	RoomTypeIMAX     RoomType = "imax"
)

type Room struct {
	bun.BaseModel `bun:"table:rooms,alias:r"`

	Id         string     `bun:"id,pk" json:"id"`
	RoomNumber int        `bun:"room_number,notnull,unique" json:"room_number"`
	Capacity   int        `bun:"capacity,notnull" json:"capacity"`
	RoomType   RoomType   `bun:"room_type,notnull" json:"room_type"`
	Status     RoomStatus `bun:"status,notnull,default:'active'" json:"status"`
	CreatedAt  time.Time  `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt  *time.Time `bun:"updated_at" json:"updated_at,omitempty"`
}

func (r *Room) IsValid() bool {
	if r.RoomNumber <= 0 || r.Capacity <= 0 {
		return false
	}
	return true
}

func (r *Room) CanChangeStatus(newStatus RoomStatus) bool {
	switch r.Status {
	case RoomStatusActive:
		return newStatus == RoomStatusInactive || newStatus == RoomStatusMaintenance
	case RoomStatusInactive:
		return newStatus == RoomStatusActive
	case RoomStatusMaintenance:
		return newStatus == RoomStatusActive
	default:
		return false
	}
}
