package models

import (
	"time"

	"github.com/uptrace/bun"
)

type User struct {
	bun.BaseModel `bun:"table:users,alias:u"`

	Id                   string     `bun:"id,pk" json:"id"`
	Name                 string     `bun:"name,notnull" json:"name"`
	Email                string     `bun:"email,notnull,unique" json:"email"`
	Password             string     `bun:"password,notnull" json:"-"`
	PhoneNumber          *string    `bun:"phone_number" json:"phone_number,omitempty"`
	TotalPaymentAmount   int        `bun:"total_payment_amount,default:0" json:"total_payment_amount"`
	Point                int        `bun:"point,default:0" json:"point"`
	OnchainWalletAddress *string    `bun:"onchain_wallet_address" json:"onchain_wallet_address,omitempty"`
	RoleId               *string    `bun:"role_id" json:"role_id,omitempty"`
	Address              *string    `bun:"address" json:"address,omitempty"`
	Salary               *int       `bun:"salary" json:"salary,omitempty"`
	CreatedAt            time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt            *time.Time `bun:"updated_at" json:"updated_at,omitempty"`

	Role             *Role      `bun:"rel:belongs-to,join:role_id=id" json:"role,omitempty"`
	CustomerBookings []*Booking `bun:"rel:has-many,join:id=customer_id" json:"customer_bookings,omitempty"`
	StaffBookings    []*Booking `bun:"rel:has-many,join:id=staff_id" json:"staff_bookings,omitempty"`
}
