import { Sequelize, ModelDefined } from 'sequelize';
import { IUser, ICustomerProfile, IDatabaseManager } from '../types/index.js';
interface IUserCreationAttributes extends Omit<IUser, 'id' | 'created_at' | 'updated_at'> {
    id?: string;
}
interface ICustomerProfileCreationAttributes extends Omit<ICustomerProfile, 'id'> {
    id?: string;
}
export type UserModel = ModelDefined<IUser, IUserCreationAttributes>;
export type CustomerProfileModel = ModelDefined<ICustomerProfile, ICustomerProfileCreationAttributes>;
declare class DatabaseManager implements IDatabaseManager {
    private static instance;
    private static sequelize;
    private static User;
    private static CustomerProfile;
    constructor();
    static getInstance(): DatabaseManager;
    private initializeDatabase;
    private defineModels;
    static getSequelize(): Sequelize;
    static getUser(): UserModel;
    static getCustomerProfile(): CustomerProfileModel;
    testConnection(): Promise<boolean>;
    syncDatabase(): Promise<boolean>;
    close(): Promise<void>;
}
export declare const sequelize: Sequelize;
export declare const User: UserModel;
export declare const CustomerProfile: CustomerProfileModel;
export default DatabaseManager;
//# sourceMappingURL=index.d.ts.map