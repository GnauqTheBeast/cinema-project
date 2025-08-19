package ws

import "fmt"

func notificationTopic(userId string) string {
	return fmt.Sprintf("notification_%s", userId)
}

func emailVerifyTopic(userId string) string {
	return fmt.Sprintf("email_verify_%s", userId)
}
