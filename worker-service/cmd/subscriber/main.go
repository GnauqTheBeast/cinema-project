package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"worker-service/internal/container"
	"worker-service/internal/subscriber"
)

func main() {
	log.Println("Starting Worker Service Payment Subscriber...")

	ctn := container.New()

	paymentSubscriber, err := subscriber.NewPaymentSubscriber(ctn)
	if err != nil {
		log.Fatalf("Failed to create payment subscriber: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := paymentSubscriber.Start(ctx); err != nil {
		log.Fatalf("Failed to start payment subscriber: %v", err)
	}

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down payment subscriber...")
	cancel()
}
