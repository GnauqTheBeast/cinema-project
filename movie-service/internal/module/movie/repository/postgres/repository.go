package postgres

import (
	"context"
	"fmt"
	"strings"
	"time"

	"movie-service/internal/module/movie/business"
	"movie-service/internal/module/movie/entity"

	"github.com/google/uuid"
	"github.com/samber/do"
	"github.com/uptrace/bun"
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

func (r *Repository) Create(ctx context.Context, movie *entity.Movie) error {
	if movie.Id == "" {
		movie.Id = uuid.New().String()
	}

	now := time.Now()
	movie.CreatedAt = &now
	movie.UpdatedAt = &now

	_, err := r.db.NewInsert().Model(movie).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create movie: %w", err)
	}

	return nil
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	result, err := r.db.NewDelete().
		Model((*entity.Movie)(nil)).
		Where("id = ?", id).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete movie: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("movie with id %s not found", id)
	}

	return nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*entity.Movie, error) {
	var movie entity.Movie
	err := r.roDb.NewSelect().
		Model(&movie).
		Where("id = ?", id).
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	return &movie, nil
}

func (r *Repository) GetMany(ctx context.Context, limit, offset int, search string) ([]*entity.Movie, error) {
	query := r.roDb.NewSelect().
		Model((*entity.Movie)(nil)).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset)

	if search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		query = query.Where(`LOWER("title") LIKE ? OR LOWER("director") LIKE ? OR LOWER("cast") LIKE ? OR LOWER("genre") LIKE ?`,
			searchPattern, searchPattern, searchPattern, searchPattern)
	}

	var movies []*entity.Movie
	err := query.Scan(ctx, &movies)
	if err != nil {
		return nil, err
	}

	return movies, nil
}

func (r *Repository) GetTotalCount(ctx context.Context, search string) (int, error) {
	query := r.roDb.NewSelect().
		Model((*entity.Movie)(nil))

	if search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		query = query.Where(`LOWER("title") LIKE ? OR LOWER("director") LIKE ? OR LOWER("cast") LIKE ? OR LOWER("genre") LIKE ?`,
			searchPattern, searchPattern, searchPattern, searchPattern)
	}

	count, err := query.Count(ctx)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *Repository) GetMovieStats(ctx context.Context) ([]*entity.MovieStat, error) {
	var results []*entity.MovieStat
	err := r.roDb.NewSelect().
		Model((*entity.Movie)(nil)).
		Column("status").
		ColumnExpr("COUNT(*) as count").
		Group("status").
		Scan(ctx, &results)
	if err != nil {
		return nil, err
	}

	return results, nil
}

func (r *Repository) Update(ctx context.Context, movie *entity.Movie) error {
	now := time.Now()
	movie.UpdatedAt = &now

	result, err := r.db.NewUpdate().
		Model(movie).
		Column("title", "director", "cast", "genre", "duration", "release_date", "description", "trailer_url", "poster_url", "status", "updated_at").
		Where("id = ?", movie.Id).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to update movie: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("movie with id %s not found", movie.Id)
	}

	return nil
}
