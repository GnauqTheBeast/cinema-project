import { RedisClientType } from 'redis';
import { IRedisManager } from '../types/index.js';
declare class RedisManager implements IRedisManager {
    private static instance;
    private static redisClient;
    private static redisPubSubClient;
    constructor();
    static getInstance(): RedisManager;
    private initializeClients;
    connect(): Promise<boolean>;
    disconnect(): Promise<boolean>;
    static getClient(): RedisClientType;
    static getPubSubClient(): RedisClientType;
    isConnected(): Promise<boolean>;
    flushAll(): Promise<boolean>;
}
export declare const redisClient: RedisClientType;
export declare const redisPubSubClient: RedisClientType;
export { redisClient as default };
export { RedisManager };
//# sourceMappingURL=redis.d.ts.map