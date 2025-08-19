import { Sequelize, DataTypes, Model, ModelDefined } from 'sequelize';
import dotenv from 'dotenv';
import { IUser, IDatabaseManager } from '../types/index.js';

interface IUserCreationAttributes extends Omit<IUser, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export type UserModel = ModelDefined<IUser, IUserCreationAttributes>;

class DatabaseManager implements IDatabaseManager {
  private static instance: DatabaseManager | null = null;
  private static sequelize: Sequelize | null = null;
  private static User: UserModel | null = null;

  constructor() {
    if (DatabaseManager.instance) {
      return DatabaseManager.instance;
    }
    
    DatabaseManager.instance = this;
    this.initializeDatabase();
    this.defineModels();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      new DatabaseManager();
    }
    return DatabaseManager.instance!;
  }

  private initializeDatabase(): void {
    dotenv.config();
    
    DatabaseManager.sequelize = new Sequelize({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cinema_app',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  }

  private defineModels(): void {
    if (!DatabaseManager.sequelize) {
      throw new Error('Sequelize not initialized');
    }

    DatabaseManager.User = DatabaseManager.sequelize.define<Model<IUser, IUserCreationAttributes>>('User', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true
      },
      total_payment_amount: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      point: {
        type: DataTypes.BIGINT,
        defaultValue: 0
      },
      onchain_wallet_address: {
        type: DataTypes.STRING,
        allowNull: true
      },
      role_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      },
      salary: {
        type: DataTypes.BIGINT,
        allowNull: true
      }
    }, {
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }) as UserModel;
  }

  static getSequelize(): Sequelize {
    if (!DatabaseManager.sequelize) {
      DatabaseManager.getInstance();
    }
    return DatabaseManager.sequelize!;
  }

  static getUser(): UserModel {
    if (!DatabaseManager.User) {
      DatabaseManager.getInstance();
    }
    return DatabaseManager.User!;
  }

  async testConnection(): Promise<boolean> {
    try {
      await DatabaseManager.sequelize!.authenticate();
      console.log('Database connection established successfully.');
      return true;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      return false;
    }
  }

  async syncDatabase(): Promise<boolean> {
    try {
      await DatabaseManager.sequelize!.sync();
      console.log('Database synchronized successfully.');
      return true;
    } catch (error) {
      console.error('Database synchronization failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (DatabaseManager.sequelize) {
      await DatabaseManager.sequelize.close();
      console.log('Database connection closed.');
    }
  }
}

// Initialize database manager
const databaseManager = DatabaseManager.getInstance();

// Export for backward compatibility
export const sequelize = DatabaseManager.getSequelize();
export const User = DatabaseManager.getUser();
export default DatabaseManager;