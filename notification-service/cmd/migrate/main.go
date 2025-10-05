package main

import (
	"context"
	"os"
	"strings"
	"time"

	"notification-service/internal/datastore"
	"notification-service/internal/models"
	"notification-service/internal/pkg/db"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/uptrace/bun"

	"github.com/joho/godotenv"
	"github.com/urfave/cli/v2"
)

const (
	argsSeedData  = "seed"
	dexSourceFile = "cmd/migrate/data/notification.csv"
	segmentLength = 4
)

func init() {
	// for development
	//nolint:errcheck
	godotenv.Load("../../.env")

	// for production
	//nolint:errcheck
	godotenv.Load("./.env")
}

func main() {
	app := &cli.App{
		Name: "migrate",
		Commands: []*cli.Command{
			commandMigrate(),
		},
	}

	if err := app.Run(os.Args); err != nil {
		logrus.Fatal(err)
	}
}

func commandMigrate() *cli.Command {
	return &cli.Command{
		Name:  "migrate",
		Usage: "migrate the database",
		Action: func(c *cli.Context) error {
			logrus.Println("DB_DSN", os.Getenv("DB_DSN"))
			logrus.Println("DB_PASSWORD", os.Getenv("DB_PASSWORD"))
			ctx := context.Background()
			database, err := db.NewPostgres(&db.PostgresConfig{
				DSN:      os.Getenv("DB_DSN"),
				Password: os.Getenv("DB_PASSWORD"),
			})
			if err != nil {
				logrus.Fatal(err)
			}

			err = datastore.Migrate(ctx, database)
			if err != nil {
				logrus.Fatal(err)
			}

			if c.Bool(argsSeedData) {
				if err := seedData(database); err != nil {
					return err
				}
			}

			return nil
		},
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name:  argsSeedData,
				Value: false,
				Usage: "seed data",
			},
		},
	}
}

func seedData(db *bun.DB) error {
	err := seedMockData(db)
	if err != nil {
		return err
	}

	return nil
}

func seedMockData(db *bun.DB) error {
	contentBytes, err := os.ReadFile(dexSourceFile)
	if err != nil {
		return err
	}

	notifications := make([]*models.Notification, 0)
	items := strings.Split(string(contentBytes), "\n")
	for _, item := range items[1:] {
		if item == "" {
			continue
		}

		segments := strings.Split(item, ",")
		if len(segments) < segmentLength {
			continue
		}

		t := time.Now()
		notifications = append(notifications, &models.Notification{
			Id:        uuid.New().String(),
			UserId:    strings.TrimSpace(segments[0]),
			Title:     models.NotificationTitle(strings.TrimSpace(segments[1])),
			Content:   strings.TrimSpace(segments[2]),
			Status:    models.NotificationStatus(strings.ToUpper(strings.TrimSpace(segments[3]))),
			CreatedAt: &t,
			UpdatedAt: &t,
		})
	}

	_, err = db.NewInsert().
		Model(&notifications).
		On("CONFLICT (id) DO UPDATE").
		Set("user_id = EXCLUDED.user_id").
		Set("title = EXCLUDED.title").
		Set("content = EXCLUDED.content").
		Set("status = EXCLUDED.status").
		Exec(context.Background())
	if err != nil {
		return err
	}

	return nil
}
