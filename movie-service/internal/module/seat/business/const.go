package business

import (
	"fmt"
	"time"
)

const (
	CACHE_TTL_1_HOUR  = time.Hour
	CACHE_TTL_30_MINS = 30 * time.Minute
	CACHE_TTL_5_MINS  = 5 * time.Minute
)

func redisSeatDetail(id string) string {
	return fmt.Sprintf("seat:detail:%s", id)
}

func redisSeatsList() string {
	return "seats:list"
}

func redisRoomSeats(roomId string) string {
	return fmt.Sprintf("room:seats:%s", roomId)
}

func redisSeatsSearch(search string) string {
	return fmt.Sprintf("seats:search:%s", search)
}
