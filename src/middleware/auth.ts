import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
