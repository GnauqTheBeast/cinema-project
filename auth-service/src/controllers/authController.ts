import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {NextFunction, Request, Response} from 'express';
import {QueryTypes} from 'sequelize';
import {v4 as uuidv4} from 'uuid';

import {CustomerProfile, sequelize, User} from '../models/index.js';
import { userClient } from '../services/userGrpcClient.js';
import {redisClient, redisPubSubClient} from '../config/redis.js';
import {
  ErrorMessages,
  HttpStatus,
  IApiError,
  IAuthResponse,
  IController,
  IEmailVerifyMessage,
  ILoginRequest,
  IOtpData,
  IOtpVerifyResult,
  IRegisterRequest,
  IVerifyOtpRequest,
  UserStatus
} from '../types/index.js';

class AuthController {
  // Constants
  static readonly ALLOWED_DISCRIMINATOR = 'Customer';
  static readonly BCRYPT_SALT_ROUNDS = 10;
  static readonly OTP_MIN = 100000;
  static readonly OTP_MAX = 999999;
  static readonly VERIFY_BASE_URL = 'http://localhost:3000/verify';
  static readonly REDIS_TOPICS = {
    EMAIL_VERIFY: 'email_verify'
  } as const;

  // Helper methods
  static generateOTP(): string {
    return Math.floor(this.OTP_MIN + Math.random() * (this.OTP_MAX - this.OTP_MIN + 1)).toString();
  }

  static createVerifyUrl(email: string, code: string): string {
    return `${this.VERIFY_BASE_URL}?email=${encodeURIComponent(email)}&code=${code}`;
  }

  static createEmailVerifyMessage(userId: string, email: string, verifyCode: string, verifyUrl: string): IEmailVerifyMessage {
    return {
      user_id: userId,
      to: email,
      verify_code: verifyCode,
      verify_url: verifyUrl
    };
  }

  static async getCustomerRoleId(): Promise<string> {
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
        { type: QueryTypes.SELECT }
      ) as { id: string }[];

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
  }

  static async saveOTPToCache(email: string, otp: string): Promise<void> {
    const OTP_CACHE_KEY = `otp:${email}`;
    const OTP_TTL = 300; // 5 minutes
    
    const otpData: IOtpData = {
      otp: otp,
      count: 0,
      created_at: new Date().toISOString()
    };
    
    await redisClient.setEx(OTP_CACHE_KEY, OTP_TTL, JSON.stringify(otpData));
  }

  static async verifyOTPFromCache(email: string, inputOtp: string): Promise<IOtpVerifyResult> {
    const OTP_CACHE_KEY = `otp:${email}`;
    const MAX_ATTEMPTS = 5;
    
    try {
      const cachedData = await redisClient.get(OTP_CACHE_KEY);
      
      if (!cachedData) {
        return {
          success: false,
          message: ErrorMessages.OTP_EXPIRED,
          attempts: 0
        };
      }
      
      const otpData: IOtpData = JSON.parse(cachedData);
      
      // Check if max attempts reached
      if (otpData.count >= MAX_ATTEMPTS) {
        return {
          success: false,
          message: ErrorMessages.OTP_MAX_ATTEMPTS,
          attempts: otpData.count
        };
      }
      
      // Increment attempt count
      otpData.count++;
      
      // Check if OTP matches
      if (otpData.otp === inputOtp) {
        // OTP is correct, delete from cache
        await redisClient.del(OTP_CACHE_KEY);
        return {
          success: true,
          message: ErrorMessages.OTP_VERIFIED,
          attempts: otpData.count
        };
      } else {
        // OTP is incorrect, update count in cache
        const remainingTTL = await redisClient.ttl(OTP_CACHE_KEY);
        await redisClient.setEx(OTP_CACHE_KEY, remainingTTL, JSON.stringify(otpData));
        
        return {
          success: false,
          message: `Invalid OTP. ${MAX_ATTEMPTS - otpData.count} attempts remaining.`,
          attempts: otpData.count
        };
      }
      
    } catch (error) {
      console.error('Error verifying OTP from cache:', error);
      throw error;
    }
  }

  // Validation schemas
  static registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    address: Joi.string().allow('', null)
  });

  static loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  static verifyOtpSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required()
  });

  static resendOtpSchema = Joi.object({
    email: Joi.string().email().required()
  });

  static register: IController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await AuthController.registerSchema.validateAsync(req.body) as IRegisterRequest;
      const { email, password, firstName, lastName, address } = data;

      // Get customer role ID from cache or database
      const customerRoleId = await AuthController.getCustomerRoleId();

      // Hash password
      const hashed = await bcrypt.hash(password, AuthController.BCRYPT_SALT_ROUNDS);

      // Ensure user row is pending in user-service via gRPC
      const name = `${firstName} ${lastName}`;
      let userId = '';
      await new Promise<void>((resolve, reject) => {
        userClient.EnsurePending({ email, name, password: hashed, role_id: customerRoleId, address }, (err: any, resp: any) => {
          if (err) return reject(err);
          userId = resp?.id || '';
          resolve();
        });
      });

      // Generate verify code and URL
      const verifyCode = AuthController.generateOTP();
      const verifyUrl = AuthController.createVerifyUrl(email, verifyCode);
      const msg = AuthController.createEmailVerifyMessage(userId, email, verifyCode, verifyUrl);

      await redisPubSubClient.publish(AuthController.REDIS_TOPICS.EMAIL_VERIFY, JSON.stringify(msg));

      // Save OTP to Redis cache for verification
      await AuthController.saveOTPToCache(email, verifyCode);

      res.status(HttpStatus.CREATED).json({ message: ErrorMessages.REGISTRATION_SUCCESS });
    } catch (err) {
      console.error('Registration error:', err);
      
      const error = err as IApiError;
      if (error.isJoi) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.details![0].message });
        return;
      }
      if (error.message === ErrorMessages.EMAIL_EXISTS) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: ErrorMessages.EMAIL_EXISTS });
        return;
      }
      next(err);
    }
  };

  static login: IController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = await AuthController.loginSchema.validateAsync(req.body) as ILoginRequest;
      // Fetch user via gRPC
      const userResp: any = await new Promise((resolve, reject) => {
        userClient.GetUserByEmail({ email }, (err: any, resp: any) => {
          if (err) return reject(err);
          resolve(resp);
        });
      });
      if (!userResp.found) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: ErrorMessages.INVALID_CREDENTIALS });
        return;
      }

      // Validate password first
      const valid = await bcrypt.compare(password, userResp.user.password);
      if (!valid) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: ErrorMessages.INVALID_CREDENTIALS });
        return;
      }

      // Check if user account is active - only after valid credentials
      if (userResp.user.status !== UserStatus.ACTIVE) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực OTP.',
          requireVerification: true,
          email: email
        });
        return;
      }

      // Get user role information
      const userWithRole = await sequelize.query(
        `SELECT u.id, u.email, u.name, r.name as role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = :email`,
        {
          replacements: { email },
          type: QueryTypes.SELECT
        }
      ) as Array<{ id: string; email: string; name: string; role_name: string }>;
      const userRole = userWithRole[0]?.role_name || 'customer';

      const token = jwt.sign(
        { 
          userId: userResp.user.id, 
          email: userResp.user.email,
          role: userRole
        }, 
        process.env.JWT_SECRET as string,
      );

      const response: IAuthResponse = {
        token,
        user: { 
          id: userResp.user.id, 
          email: userResp.user.email, 
          name: userResp.user.name,
          role: userRole
        }
      };

      res.json(response);
    } catch (err) {
      const error = err as IApiError;
      if (error.isJoi) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.details![0].message });
        return;
      }
      next(err);
    }
  };

  static verifyOtp: IController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp } = await AuthController.verifyOtpSchema.validateAsync(req.body) as IVerifyOtpRequest;
      
      const result = await AuthController.verifyOTPFromCache(email, otp);
      
      if (result.success) {
        await new Promise<void>((resolve, reject) => {
          userClient.ActivateUser({ email }, (err: any, resp: any) => {
            if (err) return reject(err);
            resolve();
          });
        });
        res.status(HttpStatus.OK).json({ 
          message: ErrorMessages.ACCOUNT_VERIFIED,
          verified: true 
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          message: result.message,
          verified: false,
          attempts: result.attempts 
        });
      }
      
    } catch (err) {
      const error = err as IApiError;
      if (error.isJoi) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.details![0].message });
        return;
      }
      next(err);
    }
  };

  static resendOtp: IController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = await AuthController.resendOtpSchema.validateAsync(req.body);
      
      // Check if user exists and is still pending
      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email không tồn tại trong hệ thống' });
        return;
      }

      if (user.dataValues.status === UserStatus.ACTIVE) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: 'Tài khoản đã được kích hoạt' });
        return;
      }

      // Generate new OTP and send
      const verifyCode = AuthController.generateOTP();
      const verifyUrl = AuthController.createVerifyUrl(email, verifyCode);
      const msg = AuthController.createEmailVerifyMessage(user.dataValues.id, email, verifyCode, verifyUrl);

      await redisPubSubClient.publish(AuthController.REDIS_TOPICS.EMAIL_VERIFY, JSON.stringify(msg));
      await AuthController.saveOTPToCache(email, verifyCode);

      res.status(HttpStatus.OK).json({ message: 'OTP mới đã được gửi đến email của bạn' });
    } catch (err) {
      const error = err as IApiError;
      if (error.isJoi) {
        res.status(HttpStatus.BAD_REQUEST).json({ message: error.details![0].message });
        return;
      }
      next(err);
    }
  };
}

// Export static methods for backward compatibility
export const register = AuthController.register.bind(AuthController);
export const login = AuthController.login.bind(AuthController);
export const verifyOtp = AuthController.verifyOtp.bind(AuthController);
export const resendOtp = AuthController.resendOtp.bind(AuthController);

export default AuthController;