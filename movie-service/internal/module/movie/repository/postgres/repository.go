package postgres

import (
	"github.com/samber/do"
	"github.com/uptrace/bun"
	"movie-service/internal/module/movie/business"
)

type Repository struct {
	db   *bun.DB
	roDb *bun.DB
}

func NewMovieRepository(i *do.Injector) (business.MovieRepository, error) {
	db, err := do.Invoke[*bun.DB](i)
	if err != nil {
		return nil, err
	}

	roDb, err := do.InvokeNamed[*bun.DB](i, "readonly-db")
	if err != nil {
		return nil, err
	}

	return &Repository{
		db:   db,
		roDb: roDb,
	}, nil
}
