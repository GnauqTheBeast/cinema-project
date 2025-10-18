package container

import (
	"os"

	"worker-service/internal/config"
	"worker-service/internal/pkg/database"
	"worker-service/internal/pkg/logger"

	"github.com/samber/do"
	"github.com/uptrace/bun"
)

func New(cfg *config.Config) (*do.Injector, error) {
	injector := do.New()

	do.Provide(injector, provideLogger)

	do.Provide(injector, provideDatabase)
	do.ProvideNamed(injector, "readonly-db", provideReadonlyDatabase)

	return injector, nil
}

func provideLogger(_ *do.Injector) (logger.Logger, error) {
	return logger.NewLogger(), nil
}

func provideDatabase(_ *do.Injector) (*bun.DB, error) {
	db, err := database.NewPostgres(&database.PostgresConfig{
		DSN:          os.Getenv("DB_DSN"),
		Password:     os.Getenv("DB_PASSWORD"),
		MaxOpenConns: 100,
		MaxIdleConns: 100,
	})
	if err != nil {
		return nil, err
	}

	return db, nil
}

func provideReadonlyDatabase(_ *do.Injector) (*bun.DB, error) {
	d, err := database.NewPostgres(&database.PostgresConfig{
		DSN:          os.Getenv("DB_READONLY_DSN"),
		Password:     os.Getenv("DB_READONLY_PASSWORD"),
		MaxOpenConns: 100,
		MaxIdleConns: 100,
	})
	if err != nil {
		return nil, err
	}
	return d, nil
}
