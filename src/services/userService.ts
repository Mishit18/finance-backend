import { Role, UserStatus } from '../types';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';

const userFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export class UserService {
  async getAllUsers() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: userFields,
    });
  }

  async getUserById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userFields,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateUserRole(id: string, role: Role) {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { role },
      select: userFields,
    });
  }

  async updateUserStatus(id: string, status: UserStatus) {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { status },
      select: userFields,
    });
  }

  async deleteUser(id: string) {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
