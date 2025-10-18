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
   * Verify JWT token and return user information for gRPC services
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

      const { userId, email, role, roleId, permissions } = decoded;

      // Use permissions from token if available, otherwise fetch from database
      let userPermissions: string[] = permissions || [];
      if (!userPermissions.length && roleId) {
        try {
          const dbPermissions = await PermissionService.getPermissionsByRoleId(roleId);
          userPermissions = dbPermissions.map(p => p.code);
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
        permissions: userPermissions
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

}

export default TokenService;
