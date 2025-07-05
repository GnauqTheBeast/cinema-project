const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('tblCustomer', {
  UserId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'tblUser',
      key: 'Id'
    },
    field: 'UserId'
  },
  RewardPoint: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    field: 'RewardPoint'
  },
  CustomerRanking: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Bronze',
    validate: {
      isIn: [['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']]
    },
    field: 'CustomerRanking'
  }
}, {
  tableName: 'tblCustomer',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Customer;
