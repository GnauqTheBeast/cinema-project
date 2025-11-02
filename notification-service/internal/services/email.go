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

func (e *EmailService) SubscribeNotificationQueue(ctx context.Context) error {
	emailVerifyTopic := "email_verify"
	forgotPasswordTopic := "forgot_password"
	bookingSuccessTopic := "booking_success"

	subscriber, err := e.pubsub.Subscribe(ctx, []string{emailVerifyTopic, forgotPasswordTopic, bookingSuccessTopic}, types.UnmarshalEmailVerify)
	if err != nil {
		return fmt.Errorf("failed to subscribe to emailVerifyTopic %s: %w", emailVerifyTopic, err)
	}

	logrus.Printf("Subscribed to topics: %s, %s, %s\n", emailVerifyTopic, forgotPasswordTopic, bookingSuccessTopic)

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
					BookingId:  receiveMsg.BookingId,
				}

				noti := &models.Notification{
					Id:     uuid.NewString(),
					UserId: receiveMsg.UserId,
				}

				switch msg.Topic {
				case emailVerifyTopic:
					emailVerify.Subject = "Verify your email"
					noti.Title = models.NotificationEmailVerified
					noti.Content = fmt.Sprintf("Please verify your email with code")
				case forgotPasswordTopic:
					emailVerify.Subject = "Forgot your password?"
					noti.Title = models.NotificationForgotPassword
					noti.Content = fmt.Sprintf("Please reset your password with code")
				case bookingSuccessTopic:
					emailVerify.Subject = "Booking success"
					noti.Title = models.NotificationBookingSuccess
					noti.Content = fmt.Sprintf("Scan the bar code below to get tickets")
				}

				if err := e.SendEmail(emailVerify); err != nil {
					logrus.Warnf("Error sending verify email: %v\n", err)
					continue
				}

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
	case "Booking success":
		email.Body = defaultBookingSuccessContent(email.BookingId)
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

func defaultBookingSuccessContent(bookingId string) string {
	if len(bookingId) < 8 {
		return ""
	}
	shortCode := bookingId[len(bookingId)-8:]
	shortCode = fmt.Sprintf("%s", shortCode)

	// Use free barcode API to generate barcode image
	// Format: https://bwipjs-api.metafloor.com/?bcid=code128&text=YOUR_TEXT&scale=3&height=15&includetext
	barcodeURL := fmt.Sprintf("https://bwipjs-api.metafloor.com/?bcid=code128&text=%s&scale=3&height=15&includetext", shortCode)

	return `
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      <h2 style="color: #e50914;">🎬 Booking Confirmed!</h2>
      <p>Hi there,</p>
      <p>Your cinema booking has been confirmed! We're excited to see you at the theater.</p>

      <div style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 20px; border-radius: 10px; margin: 30px 0; text-align: center;">
        <h3 style="color: white; margin: 0 0 10px 0;">Your Booking Code</h3>
        <p style="color: white; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 4px;">` + shortCode + `</p>
      </div>

      <h3 style="color: #333; text-align: center;">📱 Show this barcode at the counter</h3>
      <div style="text-align: center; background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <img src="` + barcodeURL + `" alt="Booking Barcode" style="max-width: 100%; height: auto;" />
      </div>

      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;"><strong>💡 Important:</strong> Please arrive at least 15 minutes before the showtime. Show this barcode at the counter to collect your tickets.</p>
      </div>

      <p style="margin-top: 30px;">Enjoy your movie!</p>
      <p>– The HQ Cinema Team</p>
    </div>
  </body>
</html>`
}
