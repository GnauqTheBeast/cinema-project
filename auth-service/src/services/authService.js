const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Address, FullName, Customer, Staff } = require('../models');
const { sequelize } = require('../models');

class AuthService {
  // Generate JWT token
  generateToken(userId, userType) {
    return jwt.sign(
      { 
        userId, 
        userType,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  // Generate refresh token
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  async register(userData) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        username,
        password,
        userType,
        firstName,
        lastName,
        city,
        street,
        salary,
        position,
        managerCode,
        title
      } = userData;

      // Check if username already exists
      const existingUser = await User.findOne({ 
        where: { username },
        transaction 
      });
      
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Create address
      const address = await Address.create({
        City: city,
        Street: street
      }, { transaction });

      // Create full name
      const fullName = await FullName.create({
        FirstName: firstName,
        LastName: lastName
      }, { transaction });

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await User.create({
        Discriminator: userType,
        username,
        password: hashedPassword,
        AddressId: address.Id,
        FullNameId: fullName.Id
      }, { transaction });

      // Create user type specific record
      if (userType === 'Customer') {
        await Customer.create({
          UserId: user.Id,
          RewardPoint: 0,
          CustomerRanking: 'Bronze'
        }, { transaction });
      } else if (userType === 'Staff') {
        await Staff.create({
          UserId: user.Id,
          Salary: salary || 0,
          Position: position || '',
          ManagerCode: managerCode || null,
          Title: title || null
        }, { transaction });
      }

      await transaction.commit();

      // Generate tokens
      const accessToken = this.generateToken(user.Id, userType);
      const refreshToken = this.generateRefreshToken(user.Id);

      return {
        user: {
          id: user.Id,
          username: user.username,
          userType: user.Discriminator,
          fullName: {
            firstName: fullName.FirstName,
            lastName: fullName.LastName
          },
          address: {
            city: address.City,
            street: address.Street
          }
        },
        accessToken,
        refreshToken
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Login user
  async login(username, password) {
    try {
      // Find user with all related data
      const user = await User.findOne({
        where: { username },
        include: [
          { model: Address, as: 'address' },
          { model: FullName, as: 'fullName' },
          { model: Customer, as: 'customer' },
          { model: Staff, as: 'staff' }
        ]
      });

      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Check password
      const isPasswordValid = await this.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid username or password');
      }

      // Generate tokens
      const accessToken = this.generateToken(user.Id, user.Discriminator);
      const refreshToken = this.generateRefreshToken(user.Id);

      // Prepare user data
      const userData = {
        id: user.Id,
        username: user.username,
        userType: user.Discriminator,
        fullName: user.fullName ? {
          firstName: user.fullName.FirstName,
          lastName: user.fullName.LastName
        } : null,
        address: user.address ? {
          city: user.address.City,
          street: user.address.Street
        } : null
      };

      // Add type-specific data
      if (user.Discriminator === 'Customer' && user.customer) {
        userData.customer = {
          rewardPoint: user.customer.RewardPoint,
          ranking: user.customer.CustomerRanking
        };
      } else if (user.Discriminator === 'Staff' && user.staff) {
        userData.staff = {
          salary: user.staff.Salary,
          position: user.staff.Position,
          managerCode: user.staff.ManagerCode,
          title: user.staff.Title
        };
      }

      return {
        user: userData,
        accessToken,
        refreshToken
      };

    } catch (error) {
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          { model: Address, as: 'address' },
          { model: FullName, as: 'fullName' },
          { model: Customer, as: 'customer' },
          { model: Staff, as: 'staff' }
        ]
      });

      if (!user) {
        throw new Error('User not found');
      }

      const userData = {
        id: user.Id,
        username: user.username,
        userType: user.Discriminator,
        fullName: user.fullName ? {
          firstName: user.fullName.FirstName,
          lastName: user.fullName.LastName
        } : null,
        address: user.address ? {
          city: user.address.City,
          street: user.address.Street
        } : null
      };

      // Add type-specific data
      if (user.Discriminator === 'Customer' && user.customer) {
        userData.customer = {
          rewardPoint: user.customer.RewardPoint,
          ranking: user.customer.CustomerRanking
        };
      } else if (user.Discriminator === 'Staff' && user.staff) {
        userData.staff = {
          salary: user.staff.Salary,
          position: user.staff.Position,
          managerCode: user.staff.ManagerCode,
          title: user.staff.Title
        };
      }

      return userData;

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
