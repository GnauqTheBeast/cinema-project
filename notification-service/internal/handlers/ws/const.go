package ws

import "fmt"

func notificationTopic(userId string) string {
	return fmt.Sprintf("notification_%s", userId)
}
