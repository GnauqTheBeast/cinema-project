package summarize

import (
	"context"
	"fmt"
	"time"

	"worker-service/internal/models"
	"worker-service/internal/pkg/gemini"

	"github.com/google/uuid"
	"github.com/samber/do"
	"github.com/sirupsen/logrus"
	"github.com/uptrace/bun"
)

type Worker struct {
	db            *bun.DB
	geminiClient  *gemini.Client
	batchSize     int
	checkInterval time.Duration
}

func NewWorker(ctn *do.Injector, geminiAPIKeys []string) (*Worker, error) {
	db, err := do.Invoke[*bun.DB](ctn)
	if err != nil {
		return nil, err
	}

	if len(geminiAPIKeys) == 0 {
		return nil, fmt.Errorf("at least one Gemini API key is required")
	}

	logrus.Infof("Initializing summarization worker with %d Gemini API key(s)", len(geminiAPIKeys))

	return &Worker{
		db:            db,
		geminiClient:  gemini.NewClient(geminiAPIKeys),
		batchSize:     50, // Process 50 articles at a time
		checkInterval: 30 * time.Minute,
	}, nil
}

func (w *Worker) Start(ctx context.Context) error {
	logrus.Info("Starting summarization worker...")

	ticker := time.NewTicker(w.checkInterval)
	defer ticker.Stop()

	if err := w.processPendingArticles(ctx); err != nil {
		logrus.Errorf("Initial processing failed: %v", err)
	}

	for {
		select {
		case <-ctx.Done():
			logrus.Info("Summarization worker stopped")
			return ctx.Err()
		case <-ticker.C:
			if err := w.processPendingArticles(ctx); err != nil {
				logrus.Errorf("Processing failed: %v", err)
			}
		}
	}
}

func (w *Worker) processPendingArticles(ctx context.Context) error {
	logrus.Info("Processing pending articles...")

	// Fetch pending articles
	articles, err := w.fetchPendingArticles(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch pending articles: %w", err)
	}

	if len(articles) == 0 {
		logrus.Info("No pending articles to process")
		return nil
	}

	logrus.Infof("Found %d pending articles", len(articles))

	// Group similar articles
	groups := GroupArticles(articles)

	// Log grouping statistics
	singleCount := 0
	multiCount := 0
	maxGroupSize := 0
	for _, group := range groups {
		if len(group.Articles) == 1 {
			singleCount++
			continue
		}
		multiCount++
		if len(group.Articles) > maxGroupSize {
			maxGroupSize = len(group.Articles)
		}
	}

	logrus.Infof("Grouped into %d groups: %d single articles, %d multi-article groups (largest: %d articles)",
		len(groups), singleCount, multiCount, maxGroupSize)

	// Process each group
	summariesCreated := 0
	articlesProcessed := 0

	for _, group := range groups {
		// Generate summary for all groups (including single articles)
		summary, err := w.createSummaryForGroup(ctx, group)
		if err != nil {
			logrus.Errorf("Failed to create summary for group (category: %s, language: %s, articles: %d): %v",
				group.Category, group.Language, len(group.Articles), err)
			_ = w.markArticlesProcessed(ctx, group.Articles, "")
			continue
		}

		// Update articles status
		if err = w.markArticlesProcessed(ctx, group.Articles, summary.Id); err != nil {
			logrus.Errorf("Failed to mark articles as processed: %v", err)
			continue
		}

		summariesCreated++
		articlesProcessed += len(group.Articles)
	}

	logrus.Infof("Processing completed - Summaries created: %d, Articles processed: %d", summariesCreated, articlesProcessed)
	return nil
}

func (w *Worker) fetchPendingArticles(ctx context.Context) ([]*models.NewsArticle, error) {
	var articles []*models.NewsArticle

	err := w.db.NewSelect().
		Model(&articles).
		Where("status = ?", "PENDING").
		Order("published_at DESC").
		Limit(w.batchSize).
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	return articles, nil
}

func (w *Worker) createSummaryForGroup(ctx context.Context, group *ArticleGroup) (*models.NewsSummary, error) {
	// Extract titles from articles
	titles := make([]string, len(group.Articles))
	articleIds := make([]string, len(group.Articles))
	var imageURL string

	for i, article := range group.Articles {
		titles[i] = article.Title
		articleIds[i] = article.Id
		if imageURL == "" && article.ImageURL != "" {
			imageURL = article.ImageURL
		}
	}

	articleType := "single article"
	if len(titles) > 1 {
		articleType = fmt.Sprintf("%d related articles", len(titles))
	}
	logrus.Infof("Generating summary for %s in %s", articleType, group.Language)

	// Generate topic title
	topicTitle, err := w.geminiClient.GenerateTopicTitle(ctx, titles, group.Language)
	if err != nil {
		return nil, fmt.Errorf("failed to generate topic title: %w", err)
	}

	// Generate summary
	summaryText, err := w.geminiClient.SummarizeArticles(ctx, titles, group.Language)
	if err != nil {
		return nil, fmt.Errorf("failed to generate summary: %w", err)
	}

	// Collect all tags
	tagsMap := make(map[string]bool)
	for _, article := range group.Articles {
		for _, tag := range article.Tags {
			tagsMap[tag] = true
		}
	}

	tags := make([]string, 0, len(tagsMap))
	for tag := range tagsMap {
		tags = append(tags, tag)
	}

	now := time.Now()
	isActive := true
	summary := &models.NewsSummary{
		Id:          uuid.New().String(),
		Title:       topicTitle,
		Summary:     summaryText,
		ArticleIds:  articleIds,
		SourceCount: len(group.Articles),
		Category:    group.Category,
		Language:    group.Language,
		Tags:        tags,
		ImageURL:    imageURL,
		Status:      "published",
		IsActive:    &isActive,
		CreatedAt:   &now,
		UpdatedAt:   &now,
	}

	// Save to database
	_, err = w.db.NewInsert().
		Model(summary).
		Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to insert summary: %w", err)
	}

	logrus.Infof("Created summary: %s (%d sources)", topicTitle, len(group.Articles))
	return summary, nil
}

func (w *Worker) markArticlesProcessed(ctx context.Context, articles []*models.NewsArticle, summaryId string) error {
	articleIds := make([]string, len(articles))
	for i, article := range articles {
		articleIds[i] = article.Id
	}

	now := time.Now()
	_, err := w.db.NewUpdate().
		Model((*models.NewsArticle)(nil)).
		Set("status = ?", "summarized").
		Set("summary = ?", summaryId). // Store reference to summary
		Set("updated_at = ?", &now).
		Where("id IN (?)", bun.In(articleIds)).
		Exec(ctx)

	return err
}
