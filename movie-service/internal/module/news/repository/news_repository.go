package repository

import (
	"context"

	"movie-service/internal/module/news/entity"

	"github.com/uptrace/bun"
)

type NewsRepository interface {
	GetNewsSummaries(ctx context.Context, category string, limit int, offset int) ([]*entity.NewsSummary, error)
	GetNewsSummaryByID(ctx context.Context, id string) (*entity.NewsSummary, error)
	GetArticlesByIDs(ctx context.Context, ids []string) ([]*entity.NewsArticle, error)
	CountSummaries(ctx context.Context, category string) (int, error)
}

type newsRepository struct {
	db *bun.DB
}

func NewNewsRepository(db *bun.DB) NewsRepository {
	return &newsRepository{db: db}
}

func (r *newsRepository) GetNewsSummaries(ctx context.Context, category string, limit int, offset int) ([]*entity.NewsSummary, error) {
	var summaries []*entity.NewsSummary

	query := r.db.NewSelect().
		Model(&summaries).
		Where("status = ?", "published").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset)

	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	err := query.Scan(ctx)
	if err != nil {
		return nil, err
	}

	return summaries, nil
}

func (r *newsRepository) GetNewsSummaryByID(ctx context.Context, id string) (*entity.NewsSummary, error) {
	var summary entity.NewsSummary

	err := r.db.NewSelect().
		Model(&summary).
		Where("id = ?", id).
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	return &summary, nil
}

func (r *newsRepository) GetArticlesByIDs(ctx context.Context, ids []string) ([]*entity.NewsArticle, error) {
	var articles []*entity.NewsArticle

	err := r.db.NewSelect().
		Model(&articles).
		Where("id IN (?)", bun.In(ids)).
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	return articles, nil
}

func (r *newsRepository) CountSummaries(ctx context.Context, category string) (int, error) {
	query := r.db.NewSelect().
		Model((*entity.NewsSummary)(nil)).
		Where("status = ?", "published")

	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	count, err := query.Count(ctx)
	if err != nil {
		return 0, err
	}

	return count, nil
}
