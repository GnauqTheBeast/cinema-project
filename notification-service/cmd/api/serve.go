package main

import (
	"context"
	"errors"
	"net/http"
	"os/signal"
	"strings"
	"syscall"

	"golang.org/x/sync/errgroup"

	"notification-service/internal/container"
	"notification-service/internal/handlers"
	"notification-service/internal/utils/env"

	"github.com/sirupsen/logrus"
	"github.com/urfave/cli/v2"
)

func commandServe() *cli.Command {
	return &cli.Command{
		Name:  "serve",
		Usage: "Start the notification service",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  "addr",
				Value: "0.0.0.0:8080",
				Usage: "serve address",
			},
		},
		Action: serve,
	}
}

func serve(c *cli.Context) error {
	vs, err := env.EnvsRequired(
		"API_MODE",
		"API_ORIGINS",
	)
	if err != nil {
		return err
	}

	i := container.NewContainer()

	router, err := handlers.New(&handlers.Config{
		Container: i,
		Mode:      vs["API_MODE"],
		Origins:   strings.Split(vs["API_ORIGINS"], ","),
	})

	server := &http.Server{
		Addr:    c.String("addr"),
		Handler: router,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	errWg, errCtx := errgroup.WithContext(ctx)

	errWg.Go(func() error {
		logrus.Printf("ListenAndServe: %s (%s)\n", c.String("addr"), vs["API_MODE"])
		if err = server.ListenAndServe(); err != nil && !errors.Is(http.ErrServerClosed, err) {
			return err
		}
		return nil
	})

	errWg.Go(func() error {
		<-errCtx.Done()
		return server.Shutdown(context.TODO())
	})

	return errWg.Wait()
}
