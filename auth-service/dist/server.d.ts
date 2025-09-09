import { Application } from 'express';
import { Server } from 'http';
import { IServerConfig } from './types/index.js';
declare class AuthServer {
    private app;
    private port;
    private databaseManager;
    private redisManager;
    private config;
    constructor();
    private initializeEnvironment;
    private loadConfiguration;
    private initializeMiddleware;
    private initializeRoutes;
    private healthCheck;
    private initializeErrorHandling;
    private initializeDatabase;
    private initializeRedis;
    start(): Promise<Server>;
    private setupGracefulShutdown;
    getApp(): Application;
    getConfig(): IServerConfig;
}
export default AuthServer;
//# sourceMappingURL=server.d.ts.map