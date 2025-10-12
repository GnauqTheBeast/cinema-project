import { DataTypes, Model, ModelDefined, Sequelize } from 'sequelize';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  phone_number?: string | null;
  status: string;
  gender?: string | null;
  dob?: Date | null;
  role_id?: string | null;
  address?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CustomerProfileAttributes {
  id: string;
  user_id: string;
  total_payment_amount: number;
  point: number;
  onchain_wallet_address?: string | null;
}

export type UserModel = ModelDefined<UserAttributes, Partial<UserAttributes>>;
export type CustomerProfileModel = ModelDefined<
  CustomerProfileAttributes,
  Partial<CustomerProfileAttributes>
>;

export interface Models {
  sequelize: Sequelize;
  User: UserModel;
  CustomerProfile: CustomerProfileModel;
}

export function initModels(sequelize: Sequelize): Models {
  const User = sequelize.define<Model<UserAttributes, Partial<UserAttributes>>>(
    'User',
    {
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
    },
    { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  ) as UserModel;

  const CustomerProfile = sequelize.define<
    Model<CustomerProfileAttributes, Partial<CustomerProfileAttributes>>
  >(
    'CustomerProfile',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      user_id: { type: DataTypes.STRING, allowNull: false },
      total_payment_amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      point: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      onchain_wallet_address: { type: DataTypes.STRING }
    },
    { tableName: 'customer_profile', timestamps: false }
  ) as CustomerProfileModel;

  return { sequelize, User, CustomerProfile };
}


