package crawl

import (
	"context"
	"time"

	"github.com/samber/do"
	"github.com/uptrace/bun"
)

type Worker struct {
	db     *bun.DB
	logger Logger
}

type Logger interface {
	Info(msg string, args ...interface{})
	Error(msg string, args ...interface{})
	Debug(msg string, args ...interface{})
	Warn(msg string, args ...interface{})
}

func NewWorker(ctn *do.Injector) (*Worker, error) {
	db, err := do.Invoke[*bun.DB](ctn)
	if err != nil {
		return nil, err
	}

	logger, err := do.Invoke[Logger](ctn)
	if err != nil {
		return nil, err
	}

	return &Worker{
		db:     db,
		logger: logger,
	}, nil
}

func (w *Worker) Start(ctx context.Context) error {
	w.logger.Info("Starting crawl worker...")

	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	// Run once immediately
	if err := w.crawl(ctx); err != nil {
		w.logger.Error("Initial crawl failed: %v", err)
	}

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("Crawl worker stopped")
			return ctx.Err()
		case <-ticker.C:
			if err := w.crawl(ctx); err != nil {
				w.logger.Error("Crawl failed: %v", err)
			}
		}
	}
}

func (w *Worker) crawl(ctx context.Context) error {
	w.logger.Info("Starting crawl job...")

	// TODO: Implement crawl logic
	// This is a placeholder for future implementation
	// You can implement:
	// 1. Crawl movie news from various sources
	// 2. Extract movie information
	// 3. Update database with new information
	// 4. Generate recommendations

	w.logger.Info("Crawl job completed")
	return nil
}
