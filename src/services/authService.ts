import bcrypt from 'bcryptjs';
import { Role, UserStatus } from '../types';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { UnauthorizedError, ValidationError } from '../utils/errors';

export class AuthService {
  async register(email: string, password: string, name: string, role: Role = Role.VIEWER) {
    const existingUser = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
    });

    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedError('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as Role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      token,
    };
  }
}
