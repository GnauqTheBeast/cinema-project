package crawl

import (
	"context"
	"fmt"
	"time"

	"worker-service/internal/models"

	"github.com/samber/do"
	"github.com/sirupsen/logrus"
	"github.com/uptrace/bun"
)

type Worker struct {
	db *bun.DB
}

func NewWorker(ctn *do.Injector) (*Worker, error) {
	db, err := do.Invoke[*bun.DB](ctn)
	if err != nil {
		return nil, err
	}

	return &Worker{
		db: db,
	}, nil
}

func (w *Worker) Start(ctx context.Context) error {
	logrus.Info("Starting crawl worker...")

	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	// Run once immediately
	if err := w.crawl(ctx); err != nil {
		logrus.Errorf("Initial crawl failed: %v", err)
	}

	for {
		select {
		case <-ctx.Done():
			logrus.Info("Crawl worker stopped")
			return ctx.Err()
		case <-ticker.C:
			if err := w.crawl(ctx); err != nil {
				logrus.Error("Crawl failed: %v", err)
			}
		}
	}
}

func (w *Worker) crawl(ctx context.Context) error {
	logrus.Info("Starting crawl job...")

	// Get all configured news sources
	sources := GetNewsSources()
	totalArticles := 0
	totalErrors := 0

	// Crawl each source
	for _, source := range sources {
		logrus.Infof("Crawling source: %s (%s)", source.Name, source.URL)

		articles, err := w.crawlSource(ctx, source)
		if err != nil {
			logrus.Errorf("Failed to crawl source %s: %v", source.Name, err)
			totalErrors++
			continue
		}

		// Save articles to database
		saved, err := w.saveArticles(ctx, articles)
		if err != nil {
			logrus.Errorf("Failed to save articles from %s: %v", source.Name, err)
			totalErrors++
			continue
		}

		logrus.Infof("Saved %d articles from %s", saved, source.Name)
		totalArticles += saved
	}

	logrus.Infof("Crawl job completed - Total: %d articles, Errors: %d", totalArticles, totalErrors)
	return nil
}

func (w *Worker) crawlSource(ctx context.Context, source NewsSource) ([]*models.NewsArticle, error) {
	switch source.Type {
	case "rss":
		return w.crawlRSSSource(ctx, source)
	default:
		return nil, fmt.Errorf("unsupported source type: %s", source.Type)
	}
}

func (w *Worker) crawlRSSSource(ctx context.Context, source NewsSource) ([]*models.NewsArticle, error) {
	// Fetch RSS feed
	feed, err := FetchRSSFeed(ctx, source.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch RSS feed: %w", err)
	}

	// Parse RSS items to articles
	articles, err := ParseRSSToArticles(feed, source)
	if err != nil {
		return nil, fmt.Errorf("failed to parse RSS feed: %w", err)
	}

	return articles, nil
}

func (w *Worker) saveArticles(ctx context.Context, articles []*models.NewsArticle) (int, error) {
	if len(articles) == 0 {
		return 0, nil
	}

	saved := 0
	for _, article := range articles {
		// Check if article already exists
		exists, err := w.db.NewSelect().
			Model((*models.NewsArticle)(nil)).
			Where("source_url = ?", article.SourceURL).
			Exists(ctx)
		if err != nil {
			logrus.Error("Failed to check article existence: %v", err)
			continue
		}

		if exists {
			// Update existing article
			_, err = w.db.NewUpdate().
				Model(article).
				Where("source_url = ?", article.SourceURL).
				Exec(ctx)
			if err != nil {
				logrus.Error("Failed to update article: %v", err)
				continue
			}
		} else {
			// Insert new article
			_, err = w.db.NewInsert().
				Model(article).
				Exec(ctx)
			if err != nil {
				logrus.Error("Failed to insert article: %v", err)
				continue
			}
		}

		saved++
	}

	return saved, nil
}
