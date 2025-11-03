package business

import (
	"context"
	"html"
	"net/url"
	"movie-service/internal/module/news/entity"
	"movie-service/internal/module/news/repository"
)

type NewsBusiness interface {
	GetNewsSummaries(ctx context.Context, category string, page int, pageSize int) ([]*entity.NewsSummaryWithSources, int, error)
	GetNewsSummaryByID(ctx context.Context, id string) (*entity.NewsSummaryWithSources, error)
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
		// Decode HTML entities in summary
		decodedSummary := decodeContent(summary)

		articles, err := b.repo.GetArticlesByIDs(ctx, summary.ArticleIDs)
		if err != nil {
			// If we can't get articles, just include the summary without sources
			result = append(result, &entity.NewsSummaryWithSources{
				NewsSummary: *decodedSummary,
				Sources:     []entity.NewsArticle{},
			})
			continue
		}

		// Decode articles
		decodedArticles := make([]entity.NewsArticle, len(articles))
		for i, article := range articles {
			decodedArticles[i] = *decodeArticle(article)
		}

		result = append(result, &entity.NewsSummaryWithSources{
			NewsSummary: *decodedSummary,
			Sources:     decodedArticles,
		})
	}

	return result, total, nil
}

func (b *newsBusiness) GetNewsSummaryByID(ctx context.Context, id string) (*entity.NewsSummaryWithSources, error) {
	summary, err := b.repo.GetNewsSummaryByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Decode summary
	decodedSummary := decodeContent(summary)

	articles, err := b.repo.GetArticlesByIDs(ctx, summary.ArticleIDs)
	if err != nil {
		return &entity.NewsSummaryWithSources{
			NewsSummary: *decodedSummary,
			Sources:     []entity.NewsArticle{},
		}, nil
	}

	// Decode articles
	decodedArticles := make([]entity.NewsArticle, len(articles))
	for i, article := range articles {
		decodedArticles[i] = *decodeArticle(article)
	}

	return &entity.NewsSummaryWithSources{
		NewsSummary: *decodedSummary,
		Sources:     decodedArticles,
	}, nil
}

func derefArticles(articles []*entity.NewsArticle) []entity.NewsArticle {
	result := make([]entity.NewsArticle, len(articles))
	for i, article := range articles {
		result[i] = *article
	}
	return result
}

// decodeContent decodes HTML entities and URL encoding in NewsSummary
func decodeContent(summary *entity.NewsSummary) *entity.NewsSummary {
	decoded := *summary

	// Decode title
	decoded.Title = decodeString(summary.Title)

	// Decode summary text
	decoded.Summary = decodeString(summary.Summary)

	return &decoded
}

// decodeArticle decodes HTML entities and URL encoding in NewsArticle
func decodeArticle(article *entity.NewsArticle) *entity.NewsArticle {
	decoded := *article

	// Decode title
	decoded.Title = decodeString(article.Title)

	// Decode content
	decoded.Content = decodeString(article.Content)

	// Decode author
	decoded.Author = decodeString(article.Author)

	return &decoded
}

// decodeString decodes both HTML entities and URL encoding
func decodeString(s string) string {
	// First decode URL encoding
	urlDecoded, err := url.QueryUnescape(s)
	if err != nil {
		urlDecoded = s
	}

	// Then decode HTML entities
	htmlDecoded := html.UnescapeString(urlDecoded)

	return htmlDecoded
}
