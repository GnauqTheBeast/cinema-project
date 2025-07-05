const { sequelize } = require('../config/database');
const User = require('./User');
const Address = require('./Address');
const FullName = require('./FullName');
const Customer = require('./Customer');
const Staff = require('./Staff');

// Define associations
User.belongsTo(Address, { foreignKey: 'AddressId', as: 'address' });
User.belongsTo(FullName, { foreignKey: 'FullNameId', as: 'fullName' });

Address.hasMany(User, { foreignKey: 'AddressId', as: 'users' });
FullName.hasMany(User, { foreignKey: 'FullNameId', as: 'users' });

Customer.belongsTo(User, { foreignKey: 'UserId', as: 'user' });
Staff.belongsTo(User, { foreignKey: 'UserId', as: 'user' });

User.hasOne(Customer, { foreignKey: 'UserId', as: 'customer' });
User.hasOne(Staff, { foreignKey: 'UserId', as: 'staff' });

module.exports = {
  sequelize,
  User,
  Address,
  FullName,
  Customer,
  Staff
};
