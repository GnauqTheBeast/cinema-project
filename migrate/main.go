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

	if len(os.Args) > 1 && os.Args[1] == "down" {
		log.Println(DropAllTables(ctx, db))
		return
	}
	log.Println(MigrateAll(ctx, db))
}

func MigrateAll(ctx context.Context, db *bun.DB) error {
	migrationFuncs := []func(context.Context, *bun.DB) error{
		datastore.CreateRoleTable,
		datastore.CreateUserTable,
		datastore.CreatePermissionTable,
		datastore.CreateRolePermissionTable,
		datastore.CreateMovieTable,
		datastore.CreateRoomTable,
		datastore.CreateSeatTable,
		datastore.CreateShowtimeTable,
		datastore.CreateBookingTable,
		datastore.CreateTicketTable,
		datastore.CreatePaymentTable,
		datastore.CreateNotificationTable,
		datastore.CreateStaffProfileTable,
		datastore.CreateCustomerProfileTable,
	}

	for _, migrateFunc := range migrationFuncs {
		if err := migrateFunc(ctx, db); err != nil {
			return err
		}
	}

	fmt.Println("All tables created successfully!")
	return nil
}

func DropAllTables(ctx context.Context, db *bun.DB) error {
	//dropFuncs := []func(context.Context, *bun.DB) error{
	//	datastore.DropCustomerProfileTable,
	//	datastore.DropStaffProfileTable,
	//	datastore.DropNotificationTable,
	//	datastore.DropPaymentTable,
	//	datastore.DropTicketTable,
	//	datastore.DropBookingTable,
	//	datastore.DropShowtimeTable,
	//	datastore.DropSeatTable,
	//	datastore.DropRoomTable,
	//	datastore.DropMovieTable,
	//	datastore.DropUserTable,
	//	datastore.DropRolePermissionTable,
	//	datastore.DropPermissionTable,
	//	datastore.DropRoleTable,
	//}
	//
	//for _, dropFunc := range dropFuncs {
	//	if err := dropFunc(ctx, db); err != nil {
	//		return err
	//	}
	//}

	fmt.Println("All tables dropped successfully!")
	return nil
}
