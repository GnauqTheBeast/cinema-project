import jwt, { JwtPayload } from 'jsonwebtoken';
import { PermissionService } from './permissionService.js';

export interface TokenValidationResult {
  status: number;
  message: string;
  id: string;
  role: string;
  permissions: string[];
}

export class TokenService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  /**
   * Verify JWT token and return user information
   * @param token - JWT token to verify
   * @returns Promise<TokenValidationResult> - Token validation result with user info
   */
  public static async verifyToken(token: string): Promise<TokenValidationResult> {
    try {
      if (!token) {
        return {
          status: 400,
          message: 'Token is required',
          id: '',
          role: '',
          permissions: []
        };
      }

      // Verify JWT token
      let decoded: any;
      try {
        decoded = jwt.verify(token, this.JWT_SECRET);
      } catch (error) {
        return {
          status: 401,
          message: 'Invalid or expired token',
          id: '',
          role: '',
          permissions: []
        };
      }

      const { userId, email, role, roleId } = decoded;

      // Get user permissions
      let permissions: string[] = [];
      if (roleId) {
        try {
          const userPermissions = await PermissionService.getPermissionsByRoleId(roleId);
          permissions = userPermissions.map(p => p.code);
        } catch (error) {
          console.error('Error fetching permissions:', error);
          // Continue without permissions rather than failing
        }
      }

      return {
        status: 200,
        message: 'Token is valid',
        id: userId,
        role: role || '',
        permissions: permissions
      };

    } catch (error) {
      console.error('Token validation error:', error);
      return {
        status: 500,
        message: 'Internal server error',
        id: '',
        role: '',
        permissions: []
      };
    }
  }

  /**
   * Simple token verification that returns decoded payload
   * @param token - JWT token to verify
   * @returns Promise<object> - Decoded token payload
   */
  public static async verifyTokenAsync(token: string): Promise<string | JwtPayload> {
    try {
      const decoded = await jwt.verify(token, this.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${error}`);
    }
  }
}

export default TokenService;
