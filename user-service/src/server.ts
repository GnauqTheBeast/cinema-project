import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'http';
import { Sequelize } from 'sequelize';

import { initModels, Models } from './storage/models.js';
import { startGrpcServer } from './transport/grpc/server.js';

dotenv.config();

class UserServer {
  private app: Application;
  private port: number;
  private sequelize: Sequelize;
  private models: Models;

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

    this.models = initModels(this.sequelize);

    this.app.use(cors({ origin: '*', credentials: true }));
    this.app.use(express.json());

    this.app.get('/api/v1/users/:userId', async (req: Request, res: Response) => {
      const user = await this.models.User.findOne({
        where: { id: req.params.userId }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password, ...userData } = user.toJSON();
      return res.status(200).json(userData);
    });

    this.app.put('/api/v1/users/:userId', async (req: Request, res: Response) => {
      const user = await this.models.User.findOne({
        where: { id: req.params.userId }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.set({
        name: req.body.name,
        phone_number: req.body.phone_number,
        address: req.body.address
      });

      await user.save();

      const { password, ...userData } = user.toJSON();

      return res.status(200).json({
        message: 'User profile updated successfully',
        user: userData
      });
    });
  }

  public async start(): Promise<Server> {
    await this.sequelize.authenticate();
    await this.sequelize.sync();

    await startGrpcServer(this.models);

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


