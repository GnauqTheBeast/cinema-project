package business

import (
	"fmt"

	"github.com/samber/do"
	"movie-service/internal/pkg/caching"
)

var (
	ErrInvalidTourData         = fmt.Errorf("invalid movie data")
	ErrInvalidStatusTransition = fmt.Errorf("invalid status transition")
)

type MovieRepository interface{}

type business struct {
	repository MovieRepository
	cache      caching.Cache
	roCache    caching.ReadOnlyCache
}

func NewBusiness(i *do.Injector) (*business, error) {
	cache, err := do.Invoke[caching.Cache](i)
	if err != nil {
		return nil, err
	}

	roCache, err := do.Invoke[caching.ReadOnlyCache](i)
	if err != nil {
		return nil, err
	}

	repository, err := do.Invoke[MovieRepository](i)
	if err != nil {
		return nil, err
	}

	return &business{
		repository: repository,
		cache:      cache,
		roCache:    roCache,
	}, nil
}

//func (b *business) GetMovieByName(ctx context.Context, name string) (interface{}, error) {
//	callback := func() (interface{}, error) {
//	}
//	return caching.UseCacheWithRO(ctx, b.roCache, b.cache, fmt.Sprintf("movie:%s", name), 1*time.Minute, callback)
//}
