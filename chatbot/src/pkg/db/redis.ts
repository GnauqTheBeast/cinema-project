import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../../utils/logger';

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  ignoreConnectionTest?: boolean;
}

export async function createRedisClient(config: RedisConfig): Promise<Redis> {
  let redisOptions: RedisOptions;

  if (config.url) {
    // Parse URL
    redisOptions = {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    const url = new URL(config.url);
    redisOptions.host = url.hostname;
    redisOptions.port = parseInt(url.port || '6379');

    if (url.password) {
      redisOptions.password = url.password;
    }

    const dbMatch = url.pathname.match(/\/(\d+)/);
    if (dbMatch) {
      redisOptions.db = parseInt(dbMatch[1]);
    }
  } else {
    redisOptions = {
      host: config.host || 'localhost',
      port: config.port || 6379,
      password: config.password,
      db: config.db || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };
  }

  const client = new Redis(redisOptions);

  client.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  client.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  if (!config.ignoreConnectionTest) {
    try {
      await client.ping();
      logger.info('Redis connection test successful');
    } catch (error) {
      logger.error('Redis connection test failed', error);
      throw error;
    }
  }

  return client;
}
