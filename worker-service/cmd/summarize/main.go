package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"worker-service/internal/container"
	"worker-service/internal/jobs/summarize"
)

func init() {
	godotenv.Load(".env")
}

func main() {
	// Get Gemini API keys from environment (comma-separated)
	geminiAPIKeysStr := os.Getenv("GEMINI_API_KEY")
	if geminiAPIKeysStr == "" {
		log.Fatal("GEMINI_API_KEY environment variable is required")
	}

	// Parse comma-separated API keys
	geminiAPIKeys := parseAPIKeys(geminiAPIKeysStr)
	if len(geminiAPIKeys) == 0 {
		log.Fatal("At least one valid Gemini API key is required")
	}

	log.Printf("Loaded %d Gemini API key(s) for round-robin usage", len(geminiAPIKeys))

	ctn := container.New()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	worker, err := summarize.NewWorker(ctn, geminiAPIKeys)
	if err != nil {
		log.Fatal("Failed to create summarization worker:", err)
	}

	if err := worker.Start(ctx); err != nil {
		log.Fatal("Failed to start summarization worker:", err)
	}

	log.Println("Summarization worker started...")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down summarization worker...")
	cancel()
	time.Sleep(2 * time.Second)
}

// parseAPIKeys parses comma-separated API keys and trims whitespace
func parseAPIKeys(keysStr string) []string {
	keys := strings.Split(keysStr, ",")
	result := make([]string, 0, len(keys))

	for _, key := range keys {
		trimmed := strings.TrimSpace(key)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}

	return result
}
