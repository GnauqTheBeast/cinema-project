package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"

	"migrate-cmd/datastore"

	_ "github.com/joho/godotenv/autoload"
	"github.com/uptrace/bun"
)

func main() {
	ctx := context.Background()
	sqldb := sql.OpenDB(pgdriver.NewConnector(
		pgdriver.WithDSN(os.Getenv("DB_DSN")),
		pgdriver.WithPassword(os.Getenv("DB_PASSWORD")),
	))

	db := bun.NewDB(sqldb, pgdialect.New())

	log.Println(MigrateAll(ctx, db))
}

func MigrateAll(ctx context.Context, db *bun.DB) error {
	migrationFuncs := []func(context.Context, *bun.DB) error{
		datastore.CreateRoleTable,
		datastore.CreatePermissionTable,
		datastore.CreateRolePermissionTable,
		datastore.CreateUserTable,
		datastore.CreateMovieTable,
		datastore.CreateRoomTable,
		datastore.CreateSeatTable,
		datastore.CreateShowtimeTable,
		datastore.CreateBookingTable,
		datastore.CreateTicketTable,
		datastore.CreatePaymentTable,
		datastore.CreateNotificationTable,
	}

	for _, migrateFunc := range migrationFuncs {
		if err := migrateFunc(ctx, db); err != nil {
			return err
		}
	}

	fmt.Println("All tables created successfully!")
	return nil
}
