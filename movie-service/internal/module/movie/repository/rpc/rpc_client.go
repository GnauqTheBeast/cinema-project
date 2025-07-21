package rpc

import (
	"context"

	"github.com/trekking-mobile-app/proto/pb"
)

type AuthRpcClient struct {
	client pb.AuthServiceClient
}

func NewClient(client pb.AuthServiceClient) *AuthRpcClient {
	return &AuthRpcClient{client: client}
}

func (c *AuthRpcClient) Validate(ctx context.Context, jwtToken string) (int, string, []string, error) {
	validated, err := c.client.Validate(ctx, &pb.ValidateRequest{
		Token: jwtToken,
	})
	if err != nil {
		return 0, "", nil, err
	}

	return int(validated.Status), validated.Role, validated.Permissions, nil
}
