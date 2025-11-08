package types

import "time"

type BookingHistory struct {
	Id          string     `json:"id"`
	UserId      string     `json:"user_id"`
	ShowtimeId  string     `json:"showtime_id"`
	TotalAmount float64    `json:"total_amount"`
	Status      string     `json:"status"`
	StaffId     string     `json:"staff_id,omitempty"`
	BookingType string     `json:"booking_type"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty"`

	// Enriched fields from showtime data
	MovieTitle   string `json:"movie_title,omitempty"`
	ShowtimeDate string `json:"showtime_date,omitempty"`
	ShowtimeTime string `json:"showtime_time,omitempty"`
	SeatNumbers  string `json:"seat_numbers,omitempty"`
}
