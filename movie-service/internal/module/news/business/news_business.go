package business

import (
	"context"

	"movie-service/internal/module/news/entity"
	"movie-service/internal/module/news/repository"
)

type NewsBusiness interface {
	GetNewsSummaries(ctx context.Context, category string, page int, pageSize int) ([]*entity.NewsSummaryWithSources, int, error)
	GetNewsSummaryByID(ctx context.Context, id string) (*entity.NewsSummaryWithSources, error)

	// Admin methods
	GetAllNewsSummaries(ctx context.Context, category string, page int, pageSize int) ([]*entity.NewsSummaryWithSources, int, error)
	UpdateNewsSummaryTitle(ctx context.Context, id string, title string) error
	ToggleNewsSummaryActive(ctx context.Context, id string, isActive bool) error
}

type newsBusiness struct {
	repo repository.NewsRepository
}

func NewNewsBusiness(repo repository.NewsRepository) NewsBusiness {
	return &newsBusiness{repo: repo}
}

func (b *newsBusiness) GetNewsSummaries(ctx context.Context, category string, page int, pageSize int) ([]*entity.NewsSummaryWithSources, int, error) {
	offset := (page - 1) * pageSize

	summaries, err := b.repo.GetNewsSummaries(ctx, category, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	// Get total count for pagination
	total, err := b.repo.CountSummaries(ctx, category)
	if err != nil {
		return nil, 0, err
	}

	// Enrich summaries with source articles
	result := make([]*entity.NewsSummaryWithSources, 0, len(summaries))
	for _, summary := range summaries {
		articles, err := b.repo.GetArticlesByIDs(ctx, summary.ArticleIDs)
		if err != nil {
			// If we can't get articles, just include the summary without sources
			result = append(result, &entity.NewsSummaryWithSources{
				NewsSummary: *summary,
				Sources:     []entity.NewsArticle{},
			})
			continue
		}

		result = append(result, &entity.NewsSummaryWithSources{
			NewsSummary: *summary,
			Sources:     derefArticles(articles),
		})
	}

	return result, total, nil
}

func (b *newsBusiness) GetNewsSummaryByID(ctx context.Context, id string) (*entity.NewsSummaryWithSources, error) {
	summary, err := b.repo.GetNewsSummaryByID(ctx, id)
	if err != nil {
		return nil, err
	}

	articles, err := b.repo.GetArticlesByIDs(ctx, summary.ArticleIDs)
	if err != nil {
		return &entity.NewsSummaryWithSources{
			NewsSummary: *summary,
			Sources:     []entity.NewsArticle{},
		}, nil
	}

	return &entity.NewsSummaryWithSources{
		NewsSummary: *summary,
		Sources:     derefArticles(articles),
	}, nil
}

func derefArticles(articles []*entity.NewsArticle) []entity.NewsArticle {
	result := make([]entity.NewsArticle, len(articles))
	for i, article := range articles {
		result[i] = *article
	}
	return result
}

// Admin methods

func (b *newsBusiness) GetAllNewsSummaries(ctx context.Context, category string, page int, pageSize int) ([]*entity.NewsSummaryWithSources, int, error) {
	offset := (page - 1) * pageSize

	summaries, err := b.repo.GetAllNewsSummaries(ctx, category, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	total, err := b.repo.CountAllSummaries(ctx, category)
	if err != nil {
		return nil, 0, err
	}

	// Enrich summaries with source articles
	result := make([]*entity.NewsSummaryWithSources, 0, len(summaries))
	for _, summary := range summaries {
		articles, err := b.repo.GetArticlesByIDs(ctx, summary.ArticleIDs)
		if err != nil {
			result = append(result, &entity.NewsSummaryWithSources{
				NewsSummary: *summary,
				Sources:     []entity.NewsArticle{},
			})
			continue
		}

		result = append(result, &entity.NewsSummaryWithSources{
			NewsSummary: *summary,
			Sources:     derefArticles(articles),
		})
	}

	return result, total, nil
}

func (b *newsBusiness) UpdateNewsSummaryTitle(ctx context.Context, id string, title string) error {
	return b.repo.UpdateNewsSummaryTitle(ctx, id, title)
}

func (b *newsBusiness) ToggleNewsSummaryActive(ctx context.Context, id string, isActive bool) error {
	return b.repo.UpdateNewsSummaryIsActive(ctx, id, isActive)
}
