package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"worker-service/internal/config"
	"worker-service/internal/container"
	"worker-service/internal/jobs/outbox"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	ctn, err := container.New(cfg)
	if err != nil {
		log.Fatal("Failed to create container:", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	outboxWorker := outbox.NewWorker(ctn)

	go func() {
		if err := outboxWorker.Start(ctx); err != nil {
			log.Printf("Outbox worker error: %v", err)
		}
	}()

	log.Println("Outbox worker started...")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down outbox worker...")
	cancel()
	time.Sleep(2 * time.Second)
}
