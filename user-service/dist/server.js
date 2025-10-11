import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import DatabaseManager from './config/database.js';
import userRoutes from './routes/user.js';
import { startGrpcServer } from './transport/grpc/server.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
class UserServer {
    constructor() {
        this.databaseManager = null;
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
            port: parseInt(process.env.USER_SERVICE_PORT || '4001'),
            corsOrigin: process.env.CORS_ORIGIN || '*',
            jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
            jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
        };
    }
    initializeMiddleware() {
        this.app.use(cors({
            origin: this.config.corsOrigin,
            credentials: true
        }));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
        console.log('Middleware initialized');
    }
    initializeRoutes() {
        this.app.use('/api/v1/users', userRoutes);
        this.app.get('/api/v1/health', this.healthCheck.bind(this));
        this.app.get('/', (req, res) => {
            res.json({
                message: 'User Service API',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });
        console.log('Routes initialized');
    }
    async healthCheck(req, res) {
        try {
            const dbStatus = this.databaseManager ? await this.databaseManager.testConnection() : false;
            const health = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                services: {
                    database: dbStatus ? 'connected' : 'disconnected'
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
        this.app.use('*', notFoundHandler);
        this.app.use(errorHandler);
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
    async start() {
        try {
            console.log('Starting User Service...');
            const dbInitialized = await this.initializeDatabase();
            if (!dbInitialized) {
                throw new Error('Failed to initialize database');
            }
            const server = this.app.listen(this.port, () => {
                console.log(`🚀 User service running on port ${this.port}`);
                console.log(`🏥 Health check available at http://localhost:${this.port}/api/v1/health`);
                console.log(`📝 API documentation: http://localhost:${this.port}/`);
            });
            await startGrpcServer();
            console.log(`🔌 gRPC server started on port 50051`);
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
                if (this.databaseManager) {
                    try {
                        await DatabaseManager.getSequelize().close();
                        console.log('Database connection closed');
                    }
                    catch (error) {
                        console.error('Error closing database:', error);
                    }
                }
                console.log('Graceful shutdown completed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
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
const userServer = new UserServer();
userServer.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
export default UserServer;
