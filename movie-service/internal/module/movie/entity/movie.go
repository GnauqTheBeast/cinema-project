package entity

import (
	"time"

	"github.com/uptrace/bun"
)

type MovieStatus string

const (
	MovieStatusUpcoming MovieStatus = "upcoming"
	MovieStatusShowing  MovieStatus = "showing"
	MovieStatusEnded    MovieStatus = "ended"
)

type Movie struct {
	bun.BaseModel `bun:"table:movies,alias:m"`

	Id          string      `bun:"id,pk" json:"id"`
	Title       string      `bun:"title,notnull" json:"title"`
	Director    string      `bun:"director" json:"director"`
	Cast        string      `bun:"cast" json:"cast"`
	Genre       string      `bun:"genre" json:"genre"`
	Duration    int         `bun:"duration,notnull" json:"duration"`
	ReleaseDate *time.Time  `bun:"release_date,type:date" json:"release_date"`
	Description string      `bun:"description" json:"description"`
	TrailerURL  string      `bun:"trailer_url" json:"trailer_url"`
	PosterURL   string      `bun:"poster_url" json:"poster_url"`
	Status      MovieStatus `bun:"status,notnull" json:"status"`
	CreatedAt   *time.Time  `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt   *time.Time  `bun:"updated_at" json:"updated_at"`
}

func (m *Movie) IsValid() bool {
	if m.Title == "" || m.Duration <= 0 {
		return false
	}
	return true
}

func (m *Movie) CanTransitionTo(newStatus MovieStatus) bool {
	switch m.Status {
	case MovieStatusUpcoming:
		return newStatus == MovieStatusShowing
	case MovieStatusShowing:
		return newStatus == MovieStatusEnded
	default:
		return false
	}
}
