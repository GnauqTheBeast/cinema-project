package entity

import (
	"time"

	"github.com/uptrace/bun"
)

type Movie struct {
	Id    string `bun:"id,pk" json:"id"`
	Title string `bun:"title" json:"title"`
}

type Room struct {
	Id         string `bun:"id,pk" json:"id"`
	RoomNumber int    `bun:"room_number" json:"room_number"`
}

type ShowtimeStatus string

const (
	ShowtimeStatusScheduled ShowtimeStatus = "scheduled"
	ShowtimeStatusOngoing   ShowtimeStatus = "ongoing"
	ShowtimeStatusCompleted ShowtimeStatus = "completed"
	ShowtimeStatusCanceled  ShowtimeStatus = "canceled"
)

type ShowtimeFormat string

const (
	ShowtimeFormat2D   ShowtimeFormat = "2d"
	ShowtimeFormat3D   ShowtimeFormat = "3d"
	ShowtimeFormatIMAX ShowtimeFormat = "imax"
)

type Showtime struct {
	bun.BaseModel `bun:"table:showtimes,alias:st"`

	Id        string         `bun:"id,pk" json:"id"`
	MovieId   string         `bun:"movie_id,notnull" json:"movie_id"`
	RoomId    string         `bun:"room_id,notnull" json:"room_id"`
	StartTime time.Time      `bun:"start_time,notnull" json:"start_time"`
	EndTime   time.Time      `bun:"end_time,notnull" json:"end_time"`
	Format    ShowtimeFormat `bun:"format,notnull" json:"format"`
	BasePrice float64        `bun:"base_price,notnull,type:decimal(10,2)" json:"base_price"`
	Status    ShowtimeStatus `bun:"status,notnull,default:'scheduled'" json:"status"`
	CreatedAt time.Time      `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt *time.Time     `bun:"updated_at" json:"updated_at,omitempty"`

	// Relations
	Movie *Movie `bun:"rel:belongs-to,join:movie_id=id" json:"movie,omitempty"`
	Room  *Room  `bun:"rel:belongs-to,join:room_id=id" json:"room,omitempty"`
}

func TruncateToHalfHour(t time.Time) time.Time {
	minutes := t.Minute()
	if minutes < 30 {
		return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), 0, 0, 0, t.Location())
	}
	return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), 30, 0, 0, t.Location())
}

func (s *Showtime) IsValid() bool {
	if s.MovieId == "" || s.RoomId == "" {
		return false
	}
	if s.BasePrice < 0 {
		return false
	}
	if s.EndTime.Before(s.StartTime) || s.EndTime.Equal(s.StartTime) {
		return false
	}
	return true
}

func (s *Showtime) IsActiveStatus() bool {
	return s.Status == ShowtimeStatusScheduled || s.Status == ShowtimeStatusOngoing
}

func (s *Showtime) IsUpcoming() bool {
	return s.Status == ShowtimeStatusScheduled && time.Now().Before(s.StartTime)
}

func (s *Showtime) IsOngoing() bool {
	now := time.Now()
	return s.Status == ShowtimeStatusOngoing ||
		(s.Status == ShowtimeStatusScheduled && now.After(s.StartTime) && now.Before(s.EndTime))
}

func (s *Showtime) CalculateDuration() time.Duration {
	return s.EndTime.Sub(s.StartTime)
}
