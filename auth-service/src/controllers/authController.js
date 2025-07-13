import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Customer, Staff, FullName, sequelize } from '../models/index.js';
import { default as redisClient, redisPubSubClient } from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  discriminator: Joi.string().valid('Customer').required(),
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

    if (discriminator !== 'Customer') {
      return res.status(400).json({ message: 'Chỉ cho phép đăng ký tài khoản Customer.' });
    }

    // Check if email exists
    const exists = await User.findOne({ where: { email } });
    if (exists) throw new Error('Email already exists');

    const fullName = await FullName.create({ firstName, lastName }, { transaction: t });
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    // Create User
    const user = await User.create({
      email,
      password: hashed,
      discriminator,
      fullNameId: fullName.id,
      address,
      walletAddress: null
    }, { transaction: t });

    await Customer.create({ userId: user.id }, { transaction: t });

    await t.commit();

    // Generate verify code and URL
    const verifyCode = uuidv4();
    const verifyUrl = `https://yourdomain.com/verify?code=${verifyCode}`;
    // Send to Redis pubsub
    const msg = {
      topic: 'email_verify', 
      data: {
        to: email,
        verify_code: verifyCode,
        verify_url: verifyUrl
      }
    }

    console.log(msg)

    await redisPubSubClient.publish('email_verify', JSON.stringify(msg));

    res.status(201).json({ message: 'Registered successfully. Please check your email to verify.' });
  } catch (err) {
    await t.rollback();
    if (err.isJoi) return res.status(400).json({ message: err.details[0].message });
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = await loginSchema.validateAsync(req.body);
    const user = await User.findOne({ where: { email }, include: ['fullName', 'customer', 'staff'] });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ userId: user.id, email: user.email, discriminator: user.discriminator }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, email: user.email, discriminator: user.discriminator, fullName: user.fullName } });
  } catch (err) {
    if (err.isJoi) return res.status(400).json({ message: err.details[0].message });
    next(err);
  }
}
