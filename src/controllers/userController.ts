import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserService } from '../services/userService';

const userService = new UserService();

export class UserController {
  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAllUsers();

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await userService.updateUserRole(id, role);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = await userService.updateUserStatus(id, status);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
