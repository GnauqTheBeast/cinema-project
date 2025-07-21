package business

import (
	"fmt"
	"time"

	"movie-service/internal/pkg/paging"
)

const (
	redisKeyPagingListTour        = "v1_paging_tour_%d_%d" // v1_paging_tour_<limit>_<offset>
	redisKeyPagingListTourPattern = "v1_paging_tour_*"

	redisKeyTourDetail        = "v1_tour_detail_%s" // v1_tour_<tour_id>
	redisKeyTourDetailPattern = "v1_tour_detail_*"

	pagingListTourTTL   = 1 * time.Hour
	pagingTourDetailTTL = 1 * time.Hour
)

func redisPagingListMovie(paging *paging.Paging) string {
	return fmt.Sprintf(redisKeyPagingListTour, paging.Limit, paging.Offset)
}

func redisTourDetail(tourId string) string {
	return fmt.Sprintf(redisKeyTourDetail, tourId)
}
