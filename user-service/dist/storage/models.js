import { DataTypes } from 'sequelize';
export function initModels(sequelize) {
    const User = sequelize.define('User', {
        id: { type: DataTypes.STRING, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        phone_number: { type: DataTypes.STRING },
        status: { type: DataTypes.STRING, allowNull: false },
        gender: { type: DataTypes.STRING },
        dob: { type: DataTypes.DATE },
        role_id: { type: DataTypes.STRING },
        address: { type: DataTypes.STRING },
        created_at: { type: DataTypes.DATE },
        updated_at: { type: DataTypes.DATE }
    }, { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
    const CustomerProfile = sequelize.define('CustomerProfile', {
        id: { type: DataTypes.STRING, primaryKey: true },
        user_id: { type: DataTypes.STRING, allowNull: false },
        total_payment_amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        point: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        onchain_wallet_address: { type: DataTypes.STRING }
    }, { tableName: 'customer_profile', timestamps: false });
    return { sequelize, User, CustomerProfile };
}
