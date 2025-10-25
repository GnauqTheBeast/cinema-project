import { NextFunction, Request, Response } from 'express';
import { createClient } from 'redis';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    roleId: string;
    permissions: string[];
  };
}

export interface CachedUserInfo {
  id: string;
  email: string;
  role: string;
  roleId: string;
  permissions: string[];
  cachedAt: string;
}

// Constants
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const TOKEN_CACHE_PREFIX = 'auth:token:';
const TOKEN_CACHE_TTL = 3600; // 1 hour
const AUTH_GRPC_ADDRESS = process.env.AUTH_GRPC_ADDRESS || 'localhost:50052';

// Redis client configuration
const redisClient = createClient({ url: REDIS_URL });

// Connect to Redis
redisClient.connect().catch(console.error);

// gRPC client for auth-service
let authClient: any = null;

// Initialize gRPC client
const initAuthClient = () => {
  if (authClient) return authClient;
  
  try {
    const PROTO_PATH = path.resolve(process.cwd(), '../auth-service/proto/auth.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });
    
    const proto = grpc.loadPackageDefinition(packageDefinition) as any;
    const authService = proto.auth;
    
    authClient = new authService.AuthService(AUTH_GRPC_ADDRESS, grpc.credentials.createInsecure());
    
    return authClient;
  } catch (error) {
    console.error('Failed to initialize auth gRPC client:', error);
    return null;
  }
};

/**
 * Middleware để xác thực token từ Redis cache với fallback gọi auth-service
 * Sử dụng cho các service khác để tránh gọi auth-service khi có thể
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.status(401).json({ 
      message: 'Access token is required',
      code: 'MISSING_TOKEN'
    });
    return;
  }

  // Check token in Redis cache first
  const tokenKey = `${TOKEN_CACHE_PREFIX}${token}`;
  
  redisClient.get(tokenKey)
    .then(cachedData => {
      if (cachedData) {
        // Token found in cache, use cached data
        try {
          const userInfo: CachedUserInfo = JSON.parse(cachedData);

          // Attach user info to request
          (req as AuthenticatedRequest).user = {
            id: userInfo.id,
            email: userInfo.email,
            role: userInfo.role,
            roleId: userInfo.roleId,
            permissions: userInfo.permissions
          };

          console.log(`Token validated from cache: ${token.substring(0, 10)}...`);
          next();
        } catch (error) {
          console.error('Error parsing cached user data:', error);
          res.status(401).json({ 
            message: 'Invalid cached user data',
            code: 'INVALID_CACHED_DATA'
          });
        }
      } else {
        // Token not in cache, call auth-service to verify
        console.log(`Token not in cache, calling auth-service: ${token.substring(0, 10)}...`);
        callAuthService(token, req as AuthenticatedRequest, res, next);
      }
    })
    .catch(error => {
      console.error('Redis error during token validation:', error);
      // If Redis fails, try calling auth-service as fallback
      callAuthService(token, req as AuthenticatedRequest, res, next);
    });
};

/**
 * Call auth-service to verify token and cache the result
 */
const callAuthService = (token: string, req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const client = initAuthClient();
  if (!client) {
    res.status(500).json({ 
      message: 'Auth service unavailable',
      code: 'AUTH_SERVICE_UNAVAILABLE'
    });
    return;
  }

  client.validate({ token }, (error: any, response: any) => {
    if (error) {
      console.error('Auth service error:', error);
      res.status(401).json({ 
        message: 'Token validation failed',
        code: 'TOKEN_VALIDATION_FAILED'
      });
      return;
    }

    if (response.status !== 200) {
      res.status(401).json({ 
        message: response.message || 'Token validation failed',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Cache the validated user info
    const userInfo: CachedUserInfo = {
      id: response.id,
      email: '', // Auth service doesn't return email in response
      role: response.role,
      roleId: '', // Auth service doesn't return roleId in response
      permissions: response.permissions || [],
      cachedAt: new Date().toISOString()
    };

    // Cache to Redis asynchronously
    cacheUserInfo(token, userInfo).catch(err => {
      console.error('Failed to cache user info:', err);
    });

    // Attach user info to request
    req.user = {
      id: userInfo.id,
      email: userInfo.email,
      role: userInfo.role,
      roleId: userInfo.roleId,
      permissions: userInfo.permissions
    };

    console.log(`Token validated by auth-service and cached: ${token.substring(0, 10)}...`);
    next();
  });
};

/**
 * Cache user info to Redis
 */
const cacheUserInfo = async (token: string, userInfo: CachedUserInfo): Promise<void> => {
  try {
    const tokenKey = `${TOKEN_CACHE_PREFIX}${token}`;
    await redisClient.setEx(tokenKey, TOKEN_CACHE_TTL, JSON.stringify(userInfo));
    console.log(`Cached user info for token: ${token.substring(0, 10)}...`);
  } catch (error) {
    console.error('Error caching user info:', error);
  }
};

/**
 * Middleware để kiểm tra role cụ thể
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      res.status(403).json({
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware để kiểm tra permission cụ thể
 */
export const requirePermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const userPermissions = authReq.user.permissions || [];
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSION'
      });
      return;
    }

    next();
  };
};

/**
 * Utility function để check token từ Redis
 */
export const validateToken = async (token: string): Promise<CachedUserInfo | null> => {
  try {
    const tokenKey = `${TOKEN_CACHE_PREFIX}${token}`;
    const cachedData = await redisClient.get(tokenKey);

    if (!cachedData) {
      return null;
    }

    return JSON.parse(cachedData) as CachedUserInfo;
  } catch (error) {
    console.error('Error validating token from Redis:', error);
    return null;
  }
};

export default {
  authenticateToken,
  requireRole,
  requirePermission,
  validateToken
};