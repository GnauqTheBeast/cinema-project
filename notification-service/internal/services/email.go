package services

import (
	"fmt"
	"github.com/samber/do"
	"github.com/uptrace/bun"
	"notification-service/internal/pkg/email"
	"notification-service/internal/types"
)

type EmailService struct {
	container    *do.Injector
	readonlyDb   *bun.DB
	db           *bun.DB
	Notification *NotificationService
	email        *email.EmailClient
}

func NewEmailService(i *do.Injector) (*EmailService, error) {
	readonlyDb, err := do.InvokeNamed[*bun.DB](i, "readonly-db")
	if err != nil {
		return nil, err
	}

	db, err := do.Invoke[*bun.DB](i)
	if err != nil {
		return nil, err
	}

	email, err := email.NewEmailClient(email.NewEmailConfig())
	if err != nil {
		return nil, err
	}

	return &EmailService{
		container:  i,
		readonlyDb: readonlyDb,
		db:         db,
		email:      email,
	}, nil
}

func (e *EmailService) SendVerifyEmail(email *types.EmailVerify) error {
	email.Body = defaultVerifyContent(email.VerifyCode, email.VerifyURL)
	msg := fmt.Sprintf(
		"MIME-Version: 1.0\r\n"+
			"Content-Type: text/html; charset=\"UTF-8\"\r\n"+
			"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n\r\n"+
			"%s",
		email.From, email.To, email.Subject, email.Body)

	return e.email.SendEmail(email.From, email.To, []byte(msg))
}

func defaultVerifyContent(otp, verifyUrl string) string {
	return `
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      <h2 style="color: #e50914;">🎬 Welcome to HQ Cinema</h2>
      <p>Hi there,</p>
      <p>Thank you for signing up! To continue, please verify your account using one of the following options:</p>

      <h3 style="color: #333;">🔐 Your OTP Code:</h3>
      <p style="font-size: 24px; font-weight: bold; background: #f1f1f1; padding: 10px 20px; border-radius: 8px; display: inline-block;">` + otp + `</p>

      <p style="margin-top: 30px;">OR click the button below to verify instantly:</p>
      <a href="` + verifyUrl + `" style="display: inline-block; padding: 12px 24px; background-color: #e50914; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify My Account</a>

      <p style="margin-top: 30px; color: #888;">If you didn't sign up for this account, please ignore this email.</p>
      <p>– The HQ Cinema Team</p>
    </div>
  </body>
</html>`
}
