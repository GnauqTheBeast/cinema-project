const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('tblUser', {
  Id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'Id'
  },
  Discriminator: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isIn: [['Customer', 'Staff']]
    },
    field: 'Discriminator'
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 255],
      notEmpty: true
    },
    field: 'username'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255],
      notEmpty: true
    },
    field: 'password'
  },
  AddressId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tblAddress',
      key: 'Id'
    },
    field: 'AddressId'
  },
  FullNameId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tblFullName',
      key: 'Id'
    },
    field: 'FullNameId'
  }
}, {
  tableName: 'tblUser',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = User;
