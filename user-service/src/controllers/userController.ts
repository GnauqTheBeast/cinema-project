import { NextFunction, Request, Response } from 'express';
import { Models } from '../models/models.js';
import { 
  HttpStatus, 
  ErrorMessages, 
  IApiResponse, 
  IUserResponse, 
  IUpdateUserRequest,
  IController 
} from '../types/index.js';

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

  public updateUser: IController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const updateData: IUpdateUserRequest = req.body;

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
}
