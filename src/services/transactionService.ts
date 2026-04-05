import { TransactionType, TransactionFilters, PaginationOptions, PaginatedResult } from '../types';
import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';

interface CreateTransactionData {
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  description?: string;
  userId: string;
}

interface UpdateTransactionData {
  amount?: number;
  type?: TransactionType;
  category?: string;
  date?: Date;
  description?: string;
}

const userSelect = {
  select: {
    id: true,
    name: true,
    email: true,
  },
};

export class TransactionService {
  async createTransaction(data: CreateTransactionData) {
    return prisma.transaction.create({
      data,
      include: { user: userSelect },
    });
  }

  async getTransactions(
    userId: string,
    userRole: string,
    filters: TransactionFilters = {},
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<any>> {
    const where: Record<string, any> = {};

    // Exclude soft-deleted records
    where.deletedAt = null;

    if (userRole !== 'ADMIN') {
      where.userId = userId;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    // Search in description and category
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search } },
        { category: { contains: filters.search } },
      ];
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { user: userSelect },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionById(id: string, userId: string, userRole: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, deletedAt: null },
      include: { user: userSelect },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (userRole !== 'ADMIN' && transaction.userId !== userId) {
      throw new ForbiddenError('Access denied to this transaction');
    }

    return transaction;
  }

  async updateTransaction(
    id: string,
    userId: string,
    userRole: string,
    data: UpdateTransactionData
  ) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, deletedAt: null },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (userRole !== 'ADMIN' && transaction.userId !== userId) {
      throw new ForbiddenError('Access denied to update this transaction');
    }

    return prisma.transaction.update({
      where: { id },
      data,
      include: { user: userSelect },
    });
  }

  async deleteTransaction(id: string, userId: string, userRole: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, deletedAt: null },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    if (userRole !== 'ADMIN' && transaction.userId !== userId) {
      throw new ForbiddenError('Access denied to delete this transaction');
    }

    // Soft delete — record is preserved but hidden from queries
    await prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
