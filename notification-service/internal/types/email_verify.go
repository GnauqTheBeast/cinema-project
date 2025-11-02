package types

import "encoding/json"

type EmailVerify struct {
	From       string `json:"from"`
	To         string `json:"to"`
	Subject    string `json:"subject"`
	Body       string `json:"body"`
	VerifyCode string `json:"verify_code"`
	VerifyURL  string `json:"verify_url"`
	BookingId  string `json:"booking_id"`
}

type EmailVerifyMessage struct {
	UserId     string `json:"user_id"`
	To         string `json:"to"`
	VerifyCode string `json:"verify_code"`
	VerifyURL  string `json:"verify_url"`
	BookingId  string `json:"booking_id"`
}

func UnmarshalEmailVerify(data []byte) (interface{}, error) {
	emailVerify := new(EmailVerifyMessage)
	if err := json.Unmarshal(data, emailVerify); err != nil {
		return nil, err
	}
	return emailVerify, nil
}
