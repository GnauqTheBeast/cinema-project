const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FullName = sequelize.define('tblFullName', {
  Id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'Id'
  },
  FirstName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255],
      notEmpty: true
    },
    field: 'FirstName'
  },
  LastName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255],
      notEmpty: true
    },
    field: 'LastName'
  }
}, {
  tableName: 'tblFullName',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = FullName;
