import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  logging: false,
});

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  discriminator: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fullNameId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  walletAddress: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: false
});

export const Customer = sequelize.define('Customer', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  loyaltyPoint: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'Customers',
  timestamps: false
});

export const Staff = sequelize.define('Staff', {
  userId: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  salary: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  position: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  managerCode: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'Staffs',
  timestamps: false
});

export const FullName = sequelize.define('FullName', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'FullName',
  timestamps: false
});

// Associations
User.belongsTo(FullName, { foreignKey: 'fullNameId', as: 'fullName' });
FullName.hasMany(User, { foreignKey: 'fullNameId', as: 'users' });
User.hasOne(Customer, { foreignKey: 'userId', as: 'customer' });
User.hasOne(Staff, { foreignKey: 'userId', as: 'staff' });
Customer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Staff.belongsTo(User, { foreignKey: 'userId', as: 'user' }); 