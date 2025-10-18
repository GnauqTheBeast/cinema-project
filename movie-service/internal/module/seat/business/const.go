package business

import (
	"fmt"
	"time"

	"movie-service/internal/module/seat/entity"
	"movie-service/internal/pkg/paging"
)

const (
	CACHE_TTL_1_HOUR  = time.Hour
	CACHE_TTL_30_MINS = 30 * time.Minute
	CACHE_TTL_5_MINS  = 5 * time.Minute
)

func redisSeatDetail(id string) string {
	return fmt.Sprintf("seat:detail:%s", id)
}

func redisSeatsListWithFilters(paging *paging.Paging, searchQuery, roomId, rowNumber string, seatType entity.SeatType, status entity.SeatStatus) string {
	return fmt.Sprintf("seats:list:paging:page:%d:size%d:search:%s:room:%s:row:%s:type:%s:status:%s",
		paging.Limit, paging.Offset, searchQuery, roomId, rowNumber, seatType, status)
}

func redisRoomSeats(roomId string) string {
	return fmt.Sprintf("room:seats:%s", roomId)
}
