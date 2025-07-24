package business

import (
	"fmt"
	"time"

	"movie-service/internal/pkg/paging"
)

const (
	keyPagingListMovieFormat  = "v1_paging_movie_%d_%d" // v1_paging_movie_<limit>_<offset>
	keyPagingListMoviePattern = "v1_paging_movie_*"

	keyMovieDetailFormat  = "v1_movie_detail_%s" // v1_movie_<movie_id>
	keyMovieDetailPattern = "v1_movie_detail_*"

	keyTotalMovieCount = "v1_total_movie_count" // v1_total_movie_count

	CACHE_TTL_5_SEC   = 5 * time.Second
	CACHE_TTL_15_SEC  = 15 * time.Second
	CACHE_TTL_1_MIN   = 1 * time.Minute
	CACHE_TTL_5_MINS  = 5 * time.Minute
	CACHE_TTL_15_MINS = 15 * time.Minute
	CACHE_TTL_30_MINS = 30 * time.Minute
	CACHE_TTL_1_HOUR  = 1 * time.Hour
	CACHE_TTL_6_HOUR  = 6 * time.Hour
	CACHE_TTL_12_HOUR = 12 * time.Hour
	CACHE_TTL_1_DAY   = 24 * time.Hour
)

func keyPagingListMovie(paging *paging.Paging) string {
	return fmt.Sprintf(keyPagingListMovieFormat, paging.Limit, paging.Offset)
}

func keyMovieDetail(movieId string) string {
	return fmt.Sprintf(keyMovieDetailFormat, movieId)
}
