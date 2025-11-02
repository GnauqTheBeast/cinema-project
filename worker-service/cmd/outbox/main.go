package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"worker-service/internal/container"
	"worker-service/internal/jobs/outbox"
)

func main() {
	ctn := container.New()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	outboxWorker, err := outbox.NewWorker(ctn)
	if err != nil {
		log.Fatal("Failed to create outbox worker:", err)
	}

	if err = outboxWorker.Start(ctx); err != nil {
		log.Printf("Outbox worker error: %v", err)
	}

	log.Println("Outbox worker started...")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down outbox worker...")
	cancel()
	time.Sleep(2 * time.Second)
}
