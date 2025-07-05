const { sequelize } = require('../config/database');
const { User, Address, FullName, Customer, Staff } = require('../models');

const migrate = async () => {
  try {
    console.log('🔄 Starting database migration...');

    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables synchronized successfully.');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrate().then(() => {
    process.exit(0);
  });
}

module.exports = migrate;
