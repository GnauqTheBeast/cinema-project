import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import DatabaseManager from './models/index.js';
import { RedisManager } from './config/redis.js';
import authRoutes from './routes/auth.js';
class AuthServer {
    app;
    port;
    databaseManager = null;
    redisManager = null;
    config;
    constructor() {
        this.app = express();
        this.initializeEnvironment();
        this.config = this.loadConfiguration();
        this.port = this.config.port;
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    initializeEnvironment() {
        dotenv.config();
        console.log('Environment variables loaded');
    }
    loadConfiguration() {
        return {
            port: parseInt(process.env.PORT || '3001'),
            corsOrigin: process.env.CORS_ORIGIN || '*',
            jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
            jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
        };
    }
    initializeMiddleware() {
        // CORS configuration
        this.app.use(cors({
            origin: this.config.corsOrigin,
            credentials: true
        }));
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
        console.log('Middleware initialized');
    }
    initializeRoutes() {
        // API routes
        this.app.use('/api/v1/auth', authRoutes);
        // Health check endpoint
        this.app.get('/api/v1/health', this.healthCheck.bind(this));
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Auth Service API',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });
        console.log('Routes initialized');
    }
    async healthCheck(req, res) {
        try {
            const dbStatus = this.databaseManager ? await this.databaseManager.testConnection() : false;
            const redisStatus = this.redisManager ? await this.redisManager.isConnected() : false;
            const health = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                services: {
                    database: dbStatus ? 'connected' : 'disconnected',
                    redis: redisStatus ? 'connected' : 'disconnected'
                },
                uptime: process.uptime(),
                memory: process.memoryUsage()
            };
            res.json(health);
        }
        catch (error) {
            console.error('Health check failed:', error);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
    initializeErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                message: `Route ${req.originalUrl} not found`,
                timestamp: new Date().toISOString()
            });
        });
        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('Error occurred:', {
                message: err.message,
                stack: err.stack,
                url: req.url,
                method: req.method,
                timestamp: new Date().toISOString()
            });
            res.status(err.status || 500).json({
                message: err.message || 'Internal Server Error',
                timestamp: new Date().toISOString()
            });
        });
        console.log('Error handling initialized');
    }
    async initializeDatabase() {
        try {
            this.databaseManager = DatabaseManager.getInstance();
            const connected = await this.databaseManager.testConnection();
            if (connected) {
                await this.databaseManager.syncDatabase();
                console.log('Database initialized successfully');
                return true;
            }
            else {
                throw new Error('Database connection failed');
            }
        }
        catch (error) {
            console.error('Database initialization failed:', error);
            return false;
        }
    }
    async initializeRedis() {
        try {
            this.redisManager = RedisManager.getInstance();
            const connected = await this.redisManager.isConnected();
            if (connected) {
                console.log('Redis initialized successfully');
                return true;
            }
            else {
                throw new Error('Redis connection failed');
            }
        }
        catch (error) {
            console.error('Redis initialization failed:', error);
            return false;
        }
    }
    async start() {
        try {
            console.log('Starting Auth Service...');
            // Initialize database
            const dbInitialized = await this.initializeDatabase();
            if (!dbInitialized) {
                throw new Error('Failed to initialize database');
            }
            // Initialize Redis
            const redisInitialized = await this.initializeRedis();
            if (!redisInitialized) {
                console.warn('Redis initialization failed, continuing without Redis cache');
            }
            // Start server
            const server = this.app.listen(this.port, () => {
                console.log(`🚀 Auth service running on port ${this.port}`);
                console.log(`🏥 Health check available at http://localhost:${this.port}/api/health`);
                console.log(`📝 API documentation: http://localhost:${this.port}/`);
            });
            // Graceful shutdown handling
            this.setupGracefulShutdown(server);
            return server;
        }
        catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    setupGracefulShutdown(server) {
        const gracefulShutdown = async (signal) => {
            console.log(`Received ${signal}, starting graceful shutdown...`);
            server.close(async () => {
                console.log('HTTP server closed');
                // Close database connection
                if (this.databaseManager) {
                    try {
                        await DatabaseManager.getSequelize().close();
                        console.log('Database connection closed');
                    }
                    catch (error) {
                        console.error('Error closing database:', error);
                    }
                }
                // Close Redis connections
                if (this.redisManager) {
                    try {
                        await this.redisManager.disconnect();
                        console.log('Redis connections closed');
                    }
                    catch (error) {
                        console.error('Error closing Redis:', error);
                    }
                }
                console.log('Graceful shutdown completed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason) => {
            console.error('Unhandled Rejection:', reason);
            process.exit(1);
        });
    }
    getApp() {
        return this.app;
    }
    getConfig() {
        return this.config;
    }
}
// Create and start server
const authServer = new AuthServer();
authServer.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
export default AuthServer;
//# sourceMappingURL=server.js.map