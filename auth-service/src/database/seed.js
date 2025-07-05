// Note: Imports removed as no test data is being seeded in production
// const bcrypt = require('bcryptjs');
// const { User, Address, FullName, Customer, Staff } = require('../models');

const seed = async () => {
  try {
    console.log('✅ Database seeding completed - no test data created for production environment');

    // Note: Test accounts have been removed for production
    // If you need to create initial admin accounts, do so manually through the registration API
    // or add specific production-ready seed data here

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  });
}

module.exports = seed;
