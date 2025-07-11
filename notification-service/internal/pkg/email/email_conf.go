package email

import (
	"os"

	"notification-service/internal/utils/env"
)

type EmailConfig struct {
	smtpHost     string
	smtpPort     string
	smtpUser     string
	smtpPassword string
}

func NewEmailConfig() *EmailConfig {
	_, err := env.EnvsRequired(
		"EMAIL_SMTP_HOST",
		"EMAIL_SMTP_PORT",
		"EMAIL_SMTP_USER",
		"EMAIL_SMTP_PASSWORD",
	)
	if err != nil {
		panic(err)
	}

	host := os.Getenv("EMAIL_SMTP_HOST")
	port := os.Getenv("EMAIL_SMTP_PORT")
	user := os.Getenv("EMAIL_SMTP_USER")
	password := os.Getenv("EMAIL_SMTP_PASSWORD")

	return &EmailConfig{
		smtpHost:     host,
		smtpPort:     port,
		smtpUser:     user,
		smtpPassword: password,
	}
}
