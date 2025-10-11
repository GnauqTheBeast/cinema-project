import Joi from 'joi';
import { IController, IEmailVerifyMessage, IOtpVerifyResult } from '../types/index.js';
declare class AuthController {
    static readonly ALLOWED_DISCRIMINATOR = "Customer";
    static readonly BCRYPT_SALT_ROUNDS = 10;
    static readonly OTP_MIN = 100000;
    static readonly OTP_MAX = 999999;
    static readonly VERIFY_BASE_URL = "http://localhost:3000/verify";
    static readonly REDIS_TOPICS: {
        readonly EMAIL_VERIFY: "email_verify";
    };
    static generateOTP(): string;
    static createVerifyUrl(email: string, code: string): string;
    static createEmailVerifyMessage(userId: string, email: string, verifyCode: string, verifyUrl: string): IEmailVerifyMessage;
    static getCustomerRoleId(): Promise<string>;
    static getRoleIdByName(roleName: string, cacheKey: string): Promise<string>;
    static getStaffRoleId(): Promise<string>;
    static getManagerStaffRoleId(): Promise<string>;
    static getTicketStaffRoleId(): Promise<string>;
    static saveOTPToCache(email: string, otp: string): Promise<void>;
    static verifyOTPFromCache(email: string, inputOtp: string): Promise<IOtpVerifyResult>;
    static registerSchema: Joi.ObjectSchema<any>;
    static loginSchema: Joi.ObjectSchema<any>;
    static verifyOtpSchema: Joi.ObjectSchema<any>;
    static resendOtpSchema: Joi.ObjectSchema<any>;
    static register: IController;
    static login: IController;
    static loginAdmin: IController;
    static verifyOtp: IController;
    static resendOtp: IController;
    static getPermissions: IController;
    static createStaff: IController;
}
export declare const register: IController;
export declare const login: IController;
export declare const verifyOtp: IController;
export declare const resendOtp: IController;
export declare const loginAdmin: IController;
export declare const getPermissions: IController;
export declare const createStaff: IController;
export default AuthController;
//# sourceMappingURL=authController.d.ts.map