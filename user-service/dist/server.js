import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { initModels } from './storage/models.js';
import { startGrpcServer } from './transport/grpc/server.js';
dotenv.config();
class UserServer {
    constructor() {
        this.app = express();
        this.port = parseInt(process.env.USER_SERVICE_PORT || '4001');
        this.sequelize = new Sequelize({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'cinema_app',
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            dialect: 'postgres',
            logging: false
        });
        this.app.use(cors({ origin: '*', credentials: true }));
        this.app.use(express.json());
        this.app.get('/api/health', async (req, res) => {
            try {
                await this.sequelize.authenticate();
                res.json({ status: 'ok' });
            }
            catch (e) {
                res.status(500).json({ status: 'error', message: e.message });
            }
        });
    }
    async start() {
        await this.sequelize.authenticate();
        const models = initModels(this.sequelize);
        await this.sequelize.sync();
        await startGrpcServer(models);
        const server = this.app.listen(this.port, () => {
            console.log(`user-service listening on ${this.port}`);
        });
        return server;
    }
}
const userServer = new UserServer();
userServer.start().catch((e) => {
    console.error('user-service failed to start', e);
    process.exit(1);
});
export default UserServer;
