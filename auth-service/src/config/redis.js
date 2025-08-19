import { createClient } from 'redis';

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

const redisPubSubClient = createClient({
  url: process.env.REDIS_PUBSUB_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisPubSubClient.on('error', (err) => console.error('Redis PubSub Client Error', err));

await redisClient.connect();
await redisPubSubClient.connect();

export { redisClient as default, redisPubSubClient };
