import { Request, Response, NextFunction } from 'express';

// Database types
export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  total_payment_amount: bigint;
  point: bigint;
  onchain_wallet_address?: string;
  role_id?: string;
  address?: string;
  salary?: bigint;
  created_at: Date;
  updated_at?: Date;
}

// Request/Response types
export interface IRegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  address?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface IAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// Controller types
export interface IController {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

// Redis OTP types
export interface IOtpData {
  otp: string;
  count: number;
  created_at: string;
}

export interface IOtpVerifyResult {
  success: boolean;
  message: string;
  attempts: number;
}

// Email verification types
export interface IEmailVerifyMessage {
  user_id: string;
  to: string;
  verify_code: string;
  verify_url: string;
}

// Health check types
export interface IHealthCheck {
  status: string;
  timestamp: string;
  services: {
    database: string;
    redis: string;
  };
  uptime: number;
  memory: NodeJS.MemoryUsage;
}

// Error types
export interface IApiError extends Error {
  status?: number;
  isJoi?: boolean;
  details?: any[];
}

// Database Manager interface
export interface IDatabaseManager {
  testConnection(): Promise<boolean>;
  syncDatabase(): Promise<boolean>;
}

// Redis Manager interface  
export interface IRedisManager {
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  isConnected(): Promise<boolean>;
  flushAll(): Promise<boolean>;
}

// Server configuration
export interface IServerConfig {
  port: number;
  corsOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

// Constants
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

export enum ErrorMessages {
  CUSTOMER_ONLY = 'Chỉ cho phép đăng ký tài khoản Customer.',
  EMAIL_EXISTS = 'Email already exists',
  INVALID_CREDENTIALS = 'Invalid email or password',
  REGISTRATION_SUCCESS = 'Registered successfully. Please check your email to verify.',
  OTP_EXPIRED = 'OTP expired or not found',
  OTP_MAX_ATTEMPTS = 'Maximum OTP attempts exceeded. Please request a new OTP.',
  OTP_VERIFIED = 'OTP verified successfully'
}