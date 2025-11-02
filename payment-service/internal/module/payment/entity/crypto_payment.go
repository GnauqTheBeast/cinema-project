package entity

import (
	"time"

	"github.com/uptrace/bun"
)

type CryptoPayment struct {
	bun.BaseModel `bun:"table:crypto_payments"`

	Id            string     `bun:"id,pk" json:"id"`
	BookingId     string     `bun:"booking_id,notnull" json:"booking_id"`
	TxHash        string     `bun:"tx_hash,notnull,unique" json:"tx_hash"`
	FromAddress   string     `bun:"from_address,notnull" json:"from_address"`
	ToAddress     string     `bun:"to_address,notnull" json:"to_address"`
	AmountEth     string     `bun:"amount_eth,notnull" json:"amount_eth"`
	AmountVnd     float64    `bun:"amount_vnd,notnull" json:"amount_vnd"`
	Network       string     `bun:"network,notnull" json:"network"`
	Status        string     `bun:"status,notnull,default:'pending'" json:"status"` // pending, verified, failed
	BlockNumber   *int64     `bun:"block_number" json:"block_number,omitempty"`
	Confirmations *int       `bun:"confirmations" json:"confirmations,omitempty"`
	VerifiedAt    *time.Time `bun:"verified_at" json:"verified_at,omitempty"`
	CreatedAt     time.Time  `bun:"created_at,nullzero,default:current_timestamp" json:"created_at"`
	UpdatedAt     *time.Time `bun:"updated_at" json:"updated_at,omitempty"`
}

type CryptoVerificationRequest struct {
	BookingId   string  `json:"booking_id" binding:"required"`
	TxHash      string  `json:"tx_hash" binding:"required"`
	FromAddress string  `json:"from_address" binding:"required"`
	ToAddress   string  `json:"to_address" binding:"required"`
	AmountEth   string  `json:"amount_eth" binding:"required"`
	AmountVnd   float64 `json:"amount_vnd" binding:"required"`
	Network     string  `json:"network" binding:"required"`
}
