import { Response, NextFunction } from 'express';
import { Role, UserStatus } from '../types';
import { AuthRequest } from '../types';
import { ForbiddenError } from '../utils/errors';
import prisma from '../config/database';

export const authorize = (...allowedRoles: Role[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      // Check if user is still active
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user || user.status === UserStatus.INACTIVE) {
        throw new ForbiddenError('User account is inactive');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
