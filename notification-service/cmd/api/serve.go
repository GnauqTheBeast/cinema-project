package main

import (
	"notification-service/internal/container"
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

	container := container.NewContainer()

	logrus.Println("Environment variables:", vs)
	logrus.Println("Container:", container)

	addr := c.String("addr")
	logrus.Println("Starting notification service on", addr)

	return nil
}
