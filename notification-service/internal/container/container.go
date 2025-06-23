package container

import (
	"os"

	"notification-service/internal/pkg/db"
	"notification-service/internal/utils/env"

	"github.com/samber/do"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/extra/bundebug"
)

func NewContainer() *do.Injector {
	injector := do.New()

	_, err := env.EnvsRequired(
		"DB_DSN",
		"DB_PASSWORD",
		"DB_READONLY_DSN",
		"DB_READONLY_PASSWORD",
		"REDIS_URL",
		"REDIS_CACHE_URL",
		"REDIS_CACHE_READONLY_URL",
		"REDIS_LIMITER_URL",
		"REDIS_PUBSUB_URL",
		"REDIS_PUBSUB_READONLY_URL",
	)
	if err != nil {
		panic(err)
	}

	do.Provide(injector, provideDatabase)
	do.ProvideNamed(injector, "db-readonly", provideReadonlyDatabase)

	return injector
}

func provideDatabase(_ *do.Injector) (*bun.DB, error) {
	db, err := db.NewPostgres(&db.PostgresConfig{
		DSN:          os.Getenv("DB_DSN"),
		Password:     os.Getenv("DB_PASSWORD"),
		MaxOpenConns: 100,
		MaxIdleConns: 10,
	})
	if err != nil {
		return nil, err
	}
	if os.Getenv("API_MODE") != "production" {
		db.AddQueryHook(bundebug.NewQueryHook())
	}

	return db, nil
}

func provideReadonlyDatabase(_ *do.Injector) (*bun.DB, error) {
	d, err := db.NewPostgres(&db.PostgresConfig{
		DSN:          os.Getenv("DB_READONLY_DSN"),
		Password:     os.Getenv("DB_READONLY_PASSWORD"),
		MaxOpenConns: 800,
		MaxIdleConns: 800,
	})
	if err != nil {
		return nil, err
	}
	if os.Getenv("API_MODE") != "production" {
		d.AddQueryHook(bundebug.NewQueryHook())
	}
	return d, nil
}
