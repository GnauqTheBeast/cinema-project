import { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { Models } from '../models/models.js';
import {
  HttpStatus,
  ErrorMessages,
  IApiResponse,
  IUserResponse,
  IUpdateUserRequest,
  IController
} from '../types';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class UserController {
  private models: Models;

  constructor(models: Models) {
    this.models = models;
  }

  public getUserById: IController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        const response: IApiResponse = {
          success: false,
          message: ErrorMessages.INVALID_REQUEST,
          status: HttpStatus.BAD_REQUEST
        };
        res.status(HttpStatus.BAD_REQUEST).json(response);
        return;
      }

      const user = await this.models.User.findOne({
        where: { id: userId }
      });

      if (!user) {
        const response: IApiResponse = {
          success: false,
          message: ErrorMessages.USER_NOT_FOUND,
          status: HttpStatus.NOT_FOUND
        };
        res.status(HttpStatus.NOT_FOUND).json(response);
        return;
      }

      const { password, ...userData } = user.toJSON();
      const userResponse: IUserResponse = userData as IUserResponse;

      const response: IApiResponse<IUserResponse> = {
        success: true,
        message: ErrorMessages.GET_SUCCESS,
        data: userResponse,
        status: HttpStatus.OK
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const updateData: IUpdateUserRequest = req.body;
      const authenticatedUser = req.user;

      if (!userId) {
        const response: IApiResponse = {
          success: false,
          message: ErrorMessages.INVALID_REQUEST,
          status: HttpStatus.BAD_REQUEST
        };
        res.status(HttpStatus.BAD_REQUEST).json(response);
        return;
      }

      if (authenticatedUser && authenticatedUser.id !== userId && !['admin', 'manager_staff'].includes(authenticatedUser.role)) {
        const response: IApiResponse = {
          success: false,
          message: 'You can only update your own profile',
          status: HttpStatus.FORBIDDEN
        };
        res.status(HttpStatus.FORBIDDEN).json(response);
        return;
      }

      const user = await this.models.User.findOne({
        where: { id: userId }
      });

      if (!user) {
        const response: IApiResponse = {
          success: false,
          message: ErrorMessages.USER_NOT_FOUND,
          status: HttpStatus.NOT_FOUND
        };
        res.status(HttpStatus.NOT_FOUND).json(response);
        return;
      }

      const updateFields: any = {};
      if (updateData.name) updateFields.name = updateData.name;
      if (updateData.phone_number) updateFields.phone_number = updateData.phone_number;
      if (updateData.address) updateFields.address = updateData.address;
      if (updateData.gender) updateFields.gender = updateData.gender;
      if (updateData.dob) updateFields.dob = updateData.dob;

      await user.update(updateFields);

      const { password, ...userData } = user.toJSON();
      const userResponse: IUserResponse = userData as IUserResponse;

      const response: IApiResponse<IUserResponse> = {
        success: true,
        message: ErrorMessages.UPDATE_SUCCESS,
        data: userResponse,
        status: HttpStatus.OK
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  public getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authenticatedUser = req.user;

      if (!authenticatedUser) {
        const response: IApiResponse = {
          success: false,
          message: 'User not authenticated',
          status: HttpStatus.UNAUTHORIZED
        };
        res.status(HttpStatus.UNAUTHORIZED).json(response);
        return;
      }

      if (!['admin', 'manager_staff'].includes(authenticatedUser.role)) {
        const response: IApiResponse = {
          success: false,
          message: 'Access denied. Admin or manager role required',
          status: HttpStatus.FORBIDDEN
        };
        res.status(HttpStatus.FORBIDDEN).json(response);
        return;
      }

      // Get query parameters for pagination and filtering
      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 10;
      const role = req.query.role as string || '';
      const search = req.query.search as string || '';

      // Build where clause for filtering
      const whereClause: any = {};

      if (role) {
        whereClause.role_id = role;
      }

      if (search) {
        // Search in name and email
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Calculate offset
      const offset = (page - 1) * size;

      // Get total count for pagination
      const totalCount = await this.models.User.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / size);

      const users = await this.models.User.findAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        include: [
          {
            model: this.models.Role,
            as: 'role',
            attributes: ['id', 'name', 'description']
          }
        ],
        limit: size,
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      const response: IApiResponse<any> = {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          data: users,
          paging: {
            page: page,
            size: size,
            total: totalCount,
            total_pages: totalPages
          }
        },
        status: HttpStatus.OK
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const authenticatedUser = req.user;

      if (!authenticatedUser) {
        const response: IApiResponse = {
          success: false,
          message: 'User not authenticated',
          status: HttpStatus.UNAUTHORIZED
        };
        res.status(HttpStatus.UNAUTHORIZED).json(response);
        return;
      }

      if (!['admin'].includes(authenticatedUser.role)) {
        const response: IApiResponse = {
          success: false,
          message: 'Access denied. Admin role required',
          status: HttpStatus.FORBIDDEN
        };
        res.status(HttpStatus.FORBIDDEN).json(response);
        return;
      }

      if (!userId) {
        const response: IApiResponse = {
          success: false,
          message: ErrorMessages.INVALID_REQUEST,
          status: HttpStatus.BAD_REQUEST
        };
        res.status(HttpStatus.BAD_REQUEST).json(response);
        return;
      }

      // Prevent admin from deleting themselves
      if (authenticatedUser.id === userId) {
        const response: IApiResponse = {
          success: false,
          message: 'You cannot delete your own account',
          status: HttpStatus.FORBIDDEN
        };
        res.status(HttpStatus.FORBIDDEN).json(response);
        return;
      }

      const user = await this.models.User.findOne({
        where: { id: userId }
      });

      if (!user) {
        const response: IApiResponse = {
          success: false,
          message: ErrorMessages.USER_NOT_FOUND,
          status: HttpStatus.NOT_FOUND
        };
        res.status(HttpStatus.NOT_FOUND).json(response);
        return;
      }

      // Prevent deleting other admins
      if (user.toJSON().role_id === 'admin') {
        const response: IApiResponse = {
          success: false,
          message: 'Cannot delete admin accounts',
          status: HttpStatus.FORBIDDEN
        };
        res.status(HttpStatus.FORBIDDEN).json(response);
        return;
      }

      await user.destroy();

      const response: IApiResponse = {
        success: true,
        message: 'User deleted successfully',
        status: HttpStatus.OK
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  };
}
