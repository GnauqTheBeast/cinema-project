import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, sequelize } from '../models/index.js';
import { default as redisClient, redisPubSubClient } from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';

// Constants
const ALLOWED_DISCRIMINATOR = 'Customer';
const BCRYPT_SALT_ROUNDS = 10;
const OTP_MIN = 100000;
const OTP_MAX = 999999;
const VERIFY_BASE_URL = 'https://yourdomain.com/verify';
const REDIS_TOPICS = {
  EMAIL_VERIFY: 'email_verify'
};
const ERROR_MESSAGES = {
  CUSTOMER_ONLY: 'Chỉ cho phép đăng ký tài khoản Customer.',
  EMAIL_EXISTS: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  REGISTRATION_SUCCESS: 'Registered successfully. Please check your email to verify.'
};
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400
};

// Helper functions
const generateOTP = () => {
  return Math.floor(OTP_MIN + Math.random() * (OTP_MAX - OTP_MIN + 1)).toString();
};

const createVerifyUrl = (code) => {
  return `${VERIFY_BASE_URL}?code=${code}`;
};

const createEmailVerifyMessage = (userId, email, verifyCode, verifyUrl) => {
  return {
    user_id: userId,
    to: email,
    verify_code: verifyCode,
    verify_url: verifyUrl
  };
};

const getCustomerRoleId = async () => {
  const CACHE_KEY = 'customer_role_id';
  
  try {
    // Try to get from Redis cache first
    const cachedRoleId = await redisClient.get(CACHE_KEY);
    if (cachedRoleId) {
      return cachedRoleId;
    }

    // If not in cache, query database
    const roleResult = await sequelize.query(
      "SELECT id FROM roles WHERE name = 'customer' LIMIT 1",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (roleResult.length === 0) {
      throw new Error('Customer role not found in database');
    }

    const customerRoleId = roleResult[0].id;
    
    // Cache for 1 hour (3600 seconds)
    await redisClient.setEx(CACHE_KEY, 3600, customerRoleId);
    
    return customerRoleId;
  } catch (error) {
    console.error('Error getting customer role ID:', error);
    throw error;
  }
};

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  discriminator: Joi.string().valid(ALLOWED_DISCRIMINATOR).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  address: Joi.string().allow('', null)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export async function register(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const data = await registerSchema.validateAsync(req.body);
    const { email, password, discriminator, firstName, lastName, address } = data;

    if (discriminator !== ALLOWED_DISCRIMINATOR) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.CUSTOMER_ONLY });
    }

    // Check if email exists
    const exists = await User.findOne({ where: { email } });
    if (exists) throw new Error(ERROR_MESSAGES.EMAIL_EXISTS);

    // Get customer role ID from cache or database
    const customerRoleId = await getCustomerRoleId();
    
    // Hash password
    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    // Create User

    const userId = uuidv4();
    const user = await User.create({
      id: userId,
      name: `${firstName} ${lastName}`,
      email,
      password: hashed,
      role_id: customerRoleId,
      address
    }, { transaction: t });

    // Generate verify code and URL
    const verifyCode = generateOTP();
    const verifyUrl = createVerifyUrl(verifyCode);
    const msg = createEmailVerifyMessage(userId, email, verifyCode, verifyUrl);

    console.log('Email verify message:', msg);

    await redisPubSubClient.publish(REDIS_TOPICS.EMAIL_VERIFY, JSON.stringify(msg));

    // TODO: save otp to redis cache (key - value): otp - email

    await t.commit();

    res.status(HTTP_STATUS.CREATED).json({ message: ERROR_MESSAGES.REGISTRATION_SUCCESS });
  } catch (err) {
    await t.rollback();
    console.error('Registration error:', err);
    if (err.isJoi) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.details[0].message });
    if (err.message === ERROR_MESSAGES.EMAIL_EXISTS) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.EMAIL_EXISTS });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = await loginSchema.validateAsync(req.body);
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.INVALID_CREDENTIALS });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.INVALID_CREDENTIALS });
    const token = jwt.sign({ userId: user.id, email: user.email, discriminator: user.discriminator }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err.isJoi) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: err.details[0].message });
    next(err);
  }
}
