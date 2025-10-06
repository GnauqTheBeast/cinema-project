import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PermissionService } from '../services/permissionService.js';
import { HttpStatus } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    roleId: string;
    permissions?: string[];
  };
}

export function requirePermission(requiredPermission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      
      if (!token) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          message: 'Token xác thực không được cung cấp' 
        });
        return;
      }

      let decoded: any;
      try {
        decoded = jwt.verify(token, (process.env.JWT_SECRET || 'your-secret-key') as string);
      } catch (error) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          message: 'Token không hợp lệ hoặc đã hết hạn' 
        });
        return;
      }

      const { userId, email, role, roleId } = decoded;
      
      if (!roleId) {
        res.status(HttpStatus.FORBIDDEN).json({ 
          message: 'Không tìm thấy thông tin vai trò' 
        });
        return;
      }

      const hasPermission = await PermissionService.hasPermission(roleId, requiredPermission);
      
      if (!hasPermission) {
        res.status(HttpStatus.FORBIDDEN).json({ 
          message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${requiredPermission}` 
        });
        return;
      }

      req.user = {
        id: userId,
        email,
        role,
        roleId
      };

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        message: 'Lỗi hệ thống khi kiểm tra quyền' 
      });
    }
  };
}

export function requireAnyPermission(requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      
      if (!token) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          message: 'Token xác thực không được cung cấp' 
        });
        return;
      }

      let decoded: any;
      try {
        decoded = jwt.verify(token, (process.env.JWT_SECRET || 'your-secret-key') as string);
      } catch (error) {
        res.status(HttpStatus.UNAUTHORIZED).json({ 
          message: 'Token không hợp lệ hoặc đã hết hạn' 
        });
        return;
      }

      const { userId, email, role, roleId } = decoded;
      
      if (!roleId) {
        res.status(HttpStatus.FORBIDDEN).json({ 
          message: 'Không tìm thấy thông tin vai trò' 
        });
        return;
      }

      const permissionChecks = await Promise.all(
        requiredPermissions.map(permission => 
          PermissionService.hasPermission(roleId, permission)
        )
      );
      
      const hasAnyPermission = permissionChecks.some(hasPermission => hasPermission);
      
      if (!hasAnyPermission) {
        res.status(HttpStatus.FORBIDDEN).json({ 
          message: `Bạn không có quyền thực hiện hành động này. Yêu cầu một trong các quyền: ${requiredPermissions.join(', ')}` 
        });
        return;
      }

      req.user = {
        id: userId,
        email,
        role,
        roleId
      };

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        message: 'Lỗi hệ thống khi kiểm tra quyền' 
      });
    }
  };
}

export default { requirePermission, requireAnyPermission };