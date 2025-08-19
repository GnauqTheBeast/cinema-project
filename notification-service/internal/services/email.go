package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"notification-service/internal/datastore"
	"notification-service/internal/models"

	"github.com/sirupsen/logrus"
	"notification-service/internal/pkg/pubsub"

	"github.com/samber/do"
	"github.com/uptrace/bun"
	"notification-service/internal/pkg/email"
	"notification-service/internal/types"
)

type EmailService struct {
	container    *do.Injector
	readonlyDb   *bun.DB
	db           *bun.DB
	pubsub       pubsub.PubSub
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

	pubsub, err := do.Invoke[pubsub.PubSub](i)
	if err != nil {
		return nil, err
	}

	return &EmailService{
		container:  i,
		readonlyDb: readonlyDb,
		db:         db,
		email:      email,
		pubsub:     pubsub,
	}, nil
}

func (e *EmailService) SubscribeEmailVerifyQueue(ctx context.Context) error {
	topic := "email_verify"
	forgotPasswordTopic := "forgot_password"

	subscriber, err := e.pubsub.Subscribe(ctx, []string{topic, forgotPasswordTopic}, types.UnmarshalEmailVerify)
	if err != nil {
		return fmt.Errorf("failed to subscribe to topic %s: %w", topic, err)
	}

	logrus.Printf("Subscribed to topics: %s, %s\n", topic, forgotPasswordTopic)

	go func() {
		defer func() {
			if err := subscriber.Unsubscribe(ctx); err != nil {
				logrus.Warnf("Error unsubscribing: %v\n", err)
			}
		}()

		channel := subscriber.MessageChan()

		for {
			select {
			case <-ctx.Done():
				logrus.Println("Context done, stopping subscriber")
				return
			case msg := <-channel:
				receiveMsg, ok := msg.Data.(*types.EmailVerifyMessage)
				if !ok {
					logrus.Warnf("Received message with wrong type: %T\n", msg.Data)
					continue
				}

				emailVerify := &types.EmailVerify{
					From:       "quangnguyenngoc314@gmail.com",
					To:         receiveMsg.To,
					VerifyCode: receiveMsg.VerifyCode,
					VerifyURL:  receiveMsg.VerifyURL,
				}

				noti := &models.Notification{
					Id:     uuid.NewString(),
					UserId: receiveMsg.UserId,
				}

				switch msg.Topic {
				case topic:
					emailVerify.Subject = "Verify your email"
					noti.Title = models.NotificationEmailVerified
					noti.Content = fmt.Sprintf("Please verify your email with code")
				case forgotPasswordTopic:
					emailVerify.Subject = "Forgot your password?"
					noti.Title = models.NotificationForgotPassword
					noti.Content = fmt.Sprintf("Please reset your password with code")
				}

				if err := e.SendEmail(emailVerify); err != nil {
					logrus.Warnf("Error sending verify email: %v\n", err)
					continue
				}

				go func() {
					if err = e.pubsub.Publish(ctx, &pubsub.Message{
						Topic: fmt.Sprintf("email_verify_%s", receiveMsg.UserId),
						Data:  emailVerify,
					}); err != nil {
						logrus.Warnf("Error publishing message to topic %s: %v\n", fmt.Sprintf("email_verify_%s", receiveMsg.UserId), err)
					}
				}()

				go func() {
					if err = datastore.CreateNotification(ctx, e.db, noti); err != nil {
						logrus.Warnf("Error creating notification: %v\n", err)
					}
				}()
			}
		}
	}()

	return nil
}

func (e *EmailService) SendEmail(email *types.EmailVerify) error {
	switch email.Subject {
	case "Verify your email":
		email.Body = defaultVerifyContent(email.VerifyCode, email.VerifyURL)

	case "Forgot your password?":
		email.Body = defaultForgotPasswordContent(email.VerifyCode, email.VerifyURL)
	}

	msg := fmt.Sprintf(
		"MIME-Version: 1.0\r	\n"+
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

func defaultForgotPasswordContent(otp, resetUrl string) string {
	return `
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      <h2 style="color: #e50914;">🔑 Password Reset Request</h2>
      <p>Hi there,</p>
      <p>We received a request to reset your password. You can reset it using one of the following methods:</p>

      <h3 style="color: #333;">📮 Your OTP Code:</h3>
      <p style="font-size: 24px; font-weight: bold; background: #f1f1f1; padding: 10px 20px; border-radius: 8px; display: inline-block;">` + otp + `</p>

      <p style="margin-top: 30px;">OR click the button below to reset your password instantly:</p>
      <a href="` + resetUrl + `" style="display: inline-block; padding: 12px 24px; background-color: #e50914; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset My Password</a>

      <p style="margin-top: 30px; color: #888;">If you did not request a password reset, you can safely ignore this email.</p>
      <p>– The HQ Cinema Team</p>
    </div>
  </body>
</html>`
}
