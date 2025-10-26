package business

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"movie-service/internal/pkg/paging"

	"movie-service/internal/module/seat/entity"
	"movie-service/internal/pkg/caching"

	"github.com/redis/go-redis/v9"
	"github.com/samber/do"
)

var (
	ErrInvalidSeatData         = fmt.Errorf("invalid seat data")
	ErrInvalidStatusTransition = fmt.Errorf("invalid status transition")
	ErrSeatNotFound            = fmt.Errorf("seat not found")
	ErrSeatPositionExists      = fmt.Errorf("seat position already exists in this room")
)

type SeatBiz interface {
	GetSeatById(ctx context.Context, id string) (*entity.Seat, error)
	GetSeats(ctx context.Context, page, size int, search, roomId, rowNumber string, seatType entity.SeatType, status entity.SeatStatus) ([]*entity.Seat, int, error)
	GetSeatsByRoom(ctx context.Context, roomId string) (*entity.SeatsDetail, error)
	CreateSeat(ctx context.Context, seat *entity.Seat) error
	UpdateSeat(ctx context.Context, id string, updates *entity.UpdateSeatRequest) error
	DeleteSeat(ctx context.Context, id string) error
	UpdateSeatStatus(ctx context.Context, id string, status entity.SeatStatus) error
}

type SeatRepository interface {
	GetByID(ctx context.Context, id string) (*entity.Seat, error)
	GetMany(ctx context.Context, limit, offset int, search, roomId, rowNumber string, seatType entity.SeatType, status entity.SeatStatus) ([]*entity.Seat, error)
	GetTotalCount(ctx context.Context, search, roomId, rowNumber string, seatType entity.SeatType, status entity.SeatStatus) (int, error)
	GetByRoom(ctx context.Context, roomId string) ([]*entity.Seat, error)
	Create(ctx context.Context, seat *entity.Seat) error
	Update(ctx context.Context, seat *entity.Seat) error
	Delete(ctx context.Context, id string) error
	ExistsBySeatPosition(ctx context.Context, roomId, seatNumber, rowNumber string, excludeId string) (bool, error)
}

type business struct {
	repository  SeatRepository
	cache       caching.Cache
	roCache     caching.ReadOnlyCache
	redisClient redis.UniversalClient
}

func NewBusiness(i *do.Injector) (SeatBiz, error) {
	cache, err := do.Invoke[caching.Cache](i)
	if err != nil {
		return nil, err
	}

	roCache, err := do.Invoke[caching.ReadOnlyCache](i)
	if err != nil {
		return nil, err
	}

	repository, err := do.Invoke[SeatRepository](i)
	if err != nil {
		return nil, err
	}

	redisClient, err := do.InvokeNamed[redis.UniversalClient](i, "redis-cache-db")
	if err != nil {
		return nil, err
	}

	return &business{
		repository:  repository,
		cache:       cache,
		roCache:     roCache,
		redisClient: redisClient,
	}, nil
}

func (b *business) GetSeatById(ctx context.Context, id string) (*entity.Seat, error) {
	if id == "" {
		return nil, ErrInvalidSeatData
	}

	callback := func() (*entity.Seat, error) {
		return b.repository.GetByID(ctx, id)
	}

	seat, err := caching.UseCacheWithRO(ctx, b.roCache, b.cache, redisSeatDetail(id), CACHE_TTL_1_HOUR, callback)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSeatNotFound
		}
		return nil, fmt.Errorf("failed to get seat: %w", err)
	}

	return seat, nil
}

func (b *business) GetSeats(ctx context.Context, page, size int, search, roomId, rowNumber string, seatType entity.SeatType, status entity.SeatStatus) ([]*entity.Seat, int, error) {
	if page < 1 || size < 1 {
		return nil, 0, ErrInvalidSeatData
	}

	offset := (page - 1) * size

	pagingObj := &paging.Paging{
		Limit:  size,
		Offset: offset,
	}

	callback := func() ([]*entity.Seat, error) {
		return b.repository.GetMany(ctx, size, offset, search, roomId, rowNumber, seatType, status)
	}

	seats, err := caching.UseCacheWithRO(ctx, b.roCache, b.cache, redisSeatsListWithFilters(pagingObj, search, roomId, rowNumber, seatType, status), CACHE_TTL_30_MINS, callback)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get seats: %w", err)
	}

	callbackTotal := func() (int, error) {
		return b.repository.GetTotalCount(ctx, search, roomId, rowNumber, seatType, status)
	}

	total, err := caching.UseCacheWithRO(ctx, b.roCache, b.cache, redisSeatsListWithFilters(pagingObj, search+":total", roomId, rowNumber, seatType, status), CACHE_TTL_30_MINS, callbackTotal)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %w", err)
	}

	return seats, total, nil
}

func (b *business) GetSeatsByRoom(ctx context.Context, roomId string) (*entity.SeatsDetail, error) {
	if roomId == "" {
		return nil, ErrInvalidSeatData
	}

	callback := func() ([]*entity.Seat, error) {
		return b.repository.GetByRoom(ctx, roomId)
	}

	seats, err := caching.UseCacheWithRO(ctx, b.roCache, b.cache, redisRoomSeats(roomId), CACHE_TTL_30_MINS, callback)
	if err != nil {
		return nil, fmt.Errorf("failed to get seats by room: %w", err)
	}

	lockedSeats, err := b.getLockedSeats(ctx, roomId)
	if err != nil {
		fmt.Printf("Warning: failed to get locked seats: %v\n", err)
		return &entity.SeatsDetail{
			Seats:       seats,
			LockedSeats: []*entity.Seat{},
		}, nil
	}

	lockedSeatsList := make([]*entity.Seat, 0)
	for _, seat := range seats {
		if lockedSeats[seat.Id] {
			seat.Status = entity.SeatStatusOccupied
			lockedSeatsList = append(lockedSeatsList, seat)
		}
	}

	return &entity.SeatsDetail{
		Seats:       seats,
		LockedSeats: lockedSeatsList,
	}, nil
}

func (b *business) getLockedSeats(ctx context.Context, roomId string) (map[string]bool, error) {
	pattern := fmt.Sprintf("seat_lock:%s:*", roomId)
	keys, err := b.redisClient.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get seat lock keys: %w", err)
	}

	lockedSeats := make(map[string]bool)
	for _, key := range keys {
		parts := strings.Split(key, ":")
		if len(parts) == 2 {
			seatId := parts[1]
			lockedSeats[seatId] = true
		}
	}

	return lockedSeats, nil
}

func (b *business) CreateSeat(ctx context.Context, seat *entity.Seat) error {
	if seat == nil || !seat.IsValid() {
		return ErrInvalidSeatData
	}

	exists, err := b.repository.ExistsBySeatPosition(ctx, seat.RoomId, seat.SeatNumber, seat.RowNumber, "")
	if err != nil {
		return fmt.Errorf("failed to check seat position: %w", err)
	}
	if exists {
		return ErrSeatPositionExists
	}

	if err := b.repository.Create(ctx, seat); err != nil {
		return fmt.Errorf("failed to create seat: %w", err)
	}

	_ = b.cache.Delete(ctx, "seats:list:*")
	_ = b.cache.Delete(ctx, redisRoomSeats(seat.RoomId))

	return nil
}

func (b *business) UpdateSeat(ctx context.Context, id string, updates *entity.UpdateSeatRequest) error {
	if id == "" || updates == nil {
		return ErrInvalidSeatData
	}

	seat, err := b.repository.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrSeatNotFound
		}
		return fmt.Errorf("failed to get seat: %w", err)
	}

	if updates.SeatNumber != nil || updates.RowNumber != nil {
		seatNumber := seat.SeatNumber
		rowNumber := seat.RowNumber

		if updates.SeatNumber != nil {
			seatNumber = *updates.SeatNumber
		}
		if updates.RowNumber != nil {
			rowNumber = *updates.RowNumber
		}

		exists, err := b.repository.ExistsBySeatPosition(ctx, seat.RoomId, seatNumber, rowNumber, id)
		if err != nil {
			return fmt.Errorf("failed to check seat position: %w", err)
		}
		if exists {
			return ErrSeatPositionExists
		}

		seat.SeatNumber = seatNumber
		seat.RowNumber = rowNumber
	}

	if updates.SeatType != nil {
		seat.SeatType = *updates.SeatType
	}

	if updates.Status != nil {
		if !seat.CanChangeStatus(*updates.Status) {
			return ErrInvalidStatusTransition
		}
		seat.Status = *updates.Status
	}

	if !seat.IsValid() {
		return ErrInvalidSeatData
	}

	if err := b.repository.Update(ctx, seat); err != nil {
		return fmt.Errorf("failed to update seat: %w", err)
	}

	_ = b.cache.Delete(ctx, redisSeatDetail(id))
	_ = b.cache.Delete(ctx, "seats:list:*")
	_ = b.cache.Delete(ctx, redisRoomSeats(seat.RoomId))

	return nil
}

func (b *business) DeleteSeat(ctx context.Context, id string) error {
	if id == "" {
		return ErrInvalidSeatData
	}

	seat, err := b.repository.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrSeatNotFound
		}
		return fmt.Errorf("failed to get seat: %w", err)
	}

	if err := b.repository.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete seat: %w", err)
	}

	_ = b.cache.Delete(ctx, redisSeatDetail(id))
	_ = b.cache.Delete(ctx, "seats:list:*")
	_ = b.cache.Delete(ctx, redisRoomSeats(seat.RoomId))

	return nil
}

func (b *business) UpdateSeatStatus(ctx context.Context, id string, status entity.SeatStatus) error {
	if id == "" {
		return ErrInvalidSeatData
	}

	seat, err := b.repository.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrSeatNotFound
		}
		return fmt.Errorf("failed to get seat: %w", err)
	}

	if !seat.CanChangeStatus(status) {
		return ErrInvalidStatusTransition
	}

	seat.Status = status

	if err := b.repository.Update(ctx, seat); err != nil {
		return fmt.Errorf("failed to update seat status: %w", err)
	}

	_ = b.cache.Delete(ctx, redisSeatDetail(id))
	_ = b.cache.Delete(ctx, "seats:list:*")
	_ = b.cache.Delete(ctx, redisRoomSeats(seat.RoomId))

	return nil
}
