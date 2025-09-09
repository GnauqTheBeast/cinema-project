import { createClient } from 'redis';
class RedisManager {
    static instance = null;
    static redisClient = null;
    static redisPubSubClient = null;
    constructor() {
        if (RedisManager.instance) {
            return RedisManager.instance;
        }
        RedisManager.instance = this;
        this.initializeClients();
    }
    static getInstance() {
        if (!RedisManager.instance) {
            new RedisManager();
        }
        return RedisManager.instance;
    }
    initializeClients() {
        // Main Redis client for caching
        RedisManager.redisClient = createClient({
            url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
        });
        // Redis client for pub/sub operations
        RedisManager.redisPubSubClient = createClient({
            url: process.env.REDIS_PUBSUB_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
        });
        // Error handlers
        RedisManager.redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
        RedisManager.redisPubSubClient.on('error', (err) => {
            console.error('Redis PubSub Client Error:', err);
        });
        // Connection handlers
        RedisManager.redisClient.on('connect', () => {
            console.log('Redis client connected successfully');
        });
        RedisManager.redisPubSubClient.on('connect', () => {
            console.log('Redis PubSub client connected successfully');
        });
    }
    async connect() {
        try {
            await Promise.all([
                RedisManager.redisClient.connect(),
                RedisManager.redisPubSubClient.connect()
            ]);
            console.log('All Redis clients connected successfully');
            return true;
        }
        catch (error) {
            console.error('Failed to connect Redis clients:', error);
            return false;
        }
    }
    async disconnect() {
        try {
            const disconnectPromises = [];
            if (RedisManager.redisClient && RedisManager.redisClient.isOpen) {
                disconnectPromises.push(RedisManager.redisClient.quit());
            }
            if (RedisManager.redisPubSubClient && RedisManager.redisPubSubClient.isOpen) {
                disconnectPromises.push(RedisManager.redisPubSubClient.quit());
            }
            if (disconnectPromises.length > 0) {
                await Promise.all(disconnectPromises);
            }
            console.log('All Redis clients disconnected');
            return true;
        }
        catch (error) {
            console.error('Failed to disconnect Redis clients:', error);
            return false;
        }
    }
    static getClient() {
        if (!RedisManager.redisClient) {
            RedisManager.getInstance();
        }
        return RedisManager.redisClient;
    }
    static getPubSubClient() {
        if (!RedisManager.redisPubSubClient) {
            RedisManager.getInstance();
        }
        return RedisManager.redisPubSubClient;
    }
    async isConnected() {
        try {
            const result = await RedisManager.redisClient.ping();
            return result === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    async flushAll() {
        try {
            await RedisManager.redisClient.flushAll();
            console.log('Redis cache cleared');
            return true;
        }
        catch (error) {
            console.error('Failed to flush Redis cache:', error);
            return false;
        }
    }
}
// Initialize and connect
const redisManager = RedisManager.getInstance();
await redisManager.connect();
// Export for backward compatibility
export const redisClient = RedisManager.getClient();
export const redisPubSubClient = RedisManager.getPubSubClient();
export { redisClient as default };
export { RedisManager };
//# sourceMappingURL=redis.js.map