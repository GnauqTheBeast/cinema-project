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

	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "up":
			log.Println(MigrateAll(ctx, db))
			return
		case "down":
			log.Println(DropAllTables(ctx, db))
			return
		case "seed":
			log.Println(SeedAll(ctx, db))
			return
		case "reset":
			log.Println("Dropping all tables...")
			if err := DropAllTables(ctx, db); err != nil {
				log.Fatal(err)
			}
			log.Println("Creating all tables...")
			if err := MigrateAll(ctx, db); err != nil {
				log.Fatal(err)
			}
			log.Println("Seeding all data...")
			log.Println(SeedAll(ctx, db))
			return
		default:
			log.Fatalf("Unknown command: %s", os.Args[1])
		}
	}
}

func MigrateAll(ctx context.Context, db *bun.DB) error {
	migrationFuncs := []func(context.Context, *bun.DB) error{
		datastore.CreateRoleTable,
		datastore.CreateUserTable,
		datastore.CreatePermissionTable,
		datastore.CreateRolePermissionTable,
		datastore.CreateMovieTable,
		datastore.CreateGenreTable,
		datastore.CreateMovieGenreTable,
		datastore.CreateRoomTable,
		datastore.CreateSeatTable,
		datastore.CreateShowtimeTable,
		datastore.CreateBookingTable,
		datastore.CreateTicketTable,
		datastore.CreatePaymentTable,
		datastore.CreateNotificationTable,
		datastore.CreateStaffProfileTable,
		datastore.CreateCustomerProfileTable,
		datastore.CreateOutboxEventTable,
		datastore.CreateNewsArticleTable,
		datastore.CreateNewsSummaryTable,
		datastore.CreateDocumentTable,
		datastore.CreateDocumentChunkTable,
		datastore.CreateChatTable,
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
	dropFuncs := []func(context.Context, *bun.DB) error{
		datastore.DropChatTable,
		datastore.DropDocumentChunkTable,
		datastore.DropDocumentTable,
		datastore.DropNewsSummaryTable,
		datastore.DropNewsArticleTable,
		datastore.DropCustomerProfileTable,
		datastore.DropStaffProfileTable,
		datastore.DropNotificationTable,
		datastore.DropPaymentTable,
		datastore.DropTicketTable,
		datastore.DropBookingTable,
		datastore.DropShowtimeTable,
		datastore.DropSeatTable,
		datastore.DropRoomTable,
		datastore.DropMovieGenreTable,
		datastore.DropGenreTable,
		datastore.DropMovieTable,
		datastore.DropUserTable,
		datastore.DropRolePermissionTable,
		datastore.DropPermissionTable,
		datastore.DropRoleTable,
		datastore.DropOutboxEventTable,
	}

	for _, dropFunc := range dropFuncs {
		if err := dropFunc(ctx, db); err != nil {
			return err
		}
	}

	fmt.Println("All tables dropped successfully!")
	return nil
}

func SeedAll(ctx context.Context, db *bun.DB) error {
	seedFuncs := []func(context.Context, *bun.DB) error{
		datastore.SeedRoles,
		datastore.SeedPermissions,
		datastore.SeedRolePermissions,
		datastore.SeedMovies,
		datastore.SeedGenres,
		datastore.SeedMovieGenres,
		datastore.SeedRooms,
		datastore.SeedSeats,
		datastore.SeedShowtimes,
		datastore.SeedUsers,
		datastore.SeedNotifications,
		datastore.SeedBookings,
		datastore.SeedTickets,
	}

	for _, seedFunc := range seedFuncs {
		if err := seedFunc(ctx, db); err != nil {
			return err
		}
	}

	fmt.Println("All data seeded successfully!")
	return nil
}
