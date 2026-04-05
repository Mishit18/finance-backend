import jwt from 'jsonwebtoken';
import { Role } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  console.warn('WARNING: JWT_SECRET not set — using insecure default for development only');
}

const SECRET = JWT_SECRET || 'dev-only-insecure-secret';

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, SECRET) as TokenPayload;
};
