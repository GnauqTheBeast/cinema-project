const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Staff = sequelize.define('tblStaff', {
  UserId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'tblUser',
      key: 'Id'
    },
    field: 'UserId'
  },
  Salary: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    validate: {
      min: 0
    },
    field: 'Salary'
  },
  Position: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255],
      notEmpty: true
    },
    field: 'Position'
  },
  ManagerCode: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'ManagerCode'
  },
  Title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'Title'
  }
}, {
  tableName: 'tblStaff',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Staff;
