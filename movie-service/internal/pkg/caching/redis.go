package caching

import (
	"context"
	"time"

	"github.com/go-redis/cache/v9"
	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	instance *cache.Cache
}

func NewRedisClient(client redis.UniversalClient, withLocalCache bool) (*RedisClient, error) {
	var localCache cache.LocalCache
	if withLocalCache {
		localCache = cache.NewTinyLFU(1000, time.Minute)
	}

	return &RedisClient{
		instance: cache.New(&cache.Options{
			Redis:      client,
			LocalCache: localCache,
		}),
	}, nil
}

func (c *RedisClient) Get(ctx context.Context, key string, target any) error {
	return c.instance.Get(ctx, key, target)
}

func (c *RedisClient) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	return c.instance.Set(&cache.Item{
		Ctx:   ctx,
		Key:   key,
		Value: value,
		TTL:   ttl,
	})
}

func (c *RedisClient) Delete(ctx context.Context, key string) error {
	return c.instance.Delete(ctx, key)
}
