import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { createPostgresConnection, createRedisClient, PostgresConfig, RedisConfig } from '../pkg/db';
import { CacheManager, RedisCache } from '../pkg/caching';
import { KeyManager } from '../pkg/keyManager';
import { EmbeddingService, DocumentService, ChatService } from '../services';
import { ChatHandler, DocumentHandler } from '../handlers';
import { logger } from '../utils/logger';

export interface AppContainer {
  pool: Pool;
  redisClient: Redis;
  cacheRedisClient: Redis;
  cacheManager: CacheManager;
  keyManager: KeyManager;
  embeddingService: EmbeddingService;
  documentService: DocumentService;
  chatService: ChatService;
  chatHandler: ChatHandler;
  documentHandler: DocumentHandler;
}

export async function createAppContainer(): Promise<AppContainer> {
  const container = createContainer<AppContainer>({
    injectionMode: InjectionMode.PROXY,
  });

  // PostgreSQL Database
  const postgresConfig: PostgresConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'chatbot',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    maxConnections: 100,
  };

  const postgresDB = createPostgresConnection(postgresConfig);
  const pool = postgresDB.getPool();

  // Redis clients
  const redisConfig: RedisConfig = {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  };

  const cacheRedisConfig: RedisConfig = {
    url: process.env.REDIS_CACHE_URL || process.env.REDIS_URL || 'redis://localhost:6379/0',
  };

  const redisClient = await createRedisClient(redisConfig);
  const cacheRedisClient = await createRedisClient(cacheRedisConfig);

  logger.info('Database connections established');

  // Register dependencies
  container.register({
    pool: asFunction(() => pool).singleton(),
    redisClient: asFunction(() => redisClient).singleton(),
    cacheRedisClient: asFunction(() => cacheRedisClient).singleton(),

    cacheManager: asFunction(({ cacheRedisClient }: AppContainer) => {
      const cache = new RedisCache(cacheRedisClient);
      return new CacheManager(cache);
    }).singleton(),

    keyManager: asFunction(() => {
      const geminiKeys = process.env.GEMINI_API_KEY;
      if (!geminiKeys) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }

      const keyManager = new KeyManager(geminiKeys);
      if (!keyManager.hasKeys()) {
        throw new Error('No valid Gemini API keys provided');
      }

      logger.info(`Loaded ${keyManager.getKeyCount()} Gemini API key(s)`);
      return keyManager;
    }).singleton(),

    embeddingService: asClass(EmbeddingService).singleton(),

    documentService: asClass(DocumentService).singleton(),

    chatService: asClass(ChatService).singleton(),

    chatHandler: asClass(ChatHandler).singleton(),

    documentHandler: asClass(DocumentHandler).singleton(),
  });

  logger.info('Dependency injection container initialized');

  return container.cradle;
}
