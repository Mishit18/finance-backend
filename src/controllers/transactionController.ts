import { Response, NextFunction } from 'express';
import { AuthRequest, TransactionFilters } from '../types';
import { TransactionService } from '../services/transactionService';

const transactionService = new TransactionService();

export class TransactionController {
  async createTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { amount, type, category, date, description } = req.body;
      const userId = req.user!.id;

      const transaction = await transactionService.createTransaction({
        amount,
        type,
        category,
        date: new Date(date),
        description,
        userId,
      });

      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { startDate, endDate, category, type, search, page, limit } = req.query;

      const filters: TransactionFilters = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (category) filters.category = category as string;
      if (type) filters.type = type as 'INCOME' | 'EXPENSE';
      if (search) filters.search = search as string;

      const pagination = {
        page: Math.max(1, parseInt(page as string) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit as string) || 20)),
      };

      const result = await transactionService.getTransactions(
        userId,
        userRole,
        filters,
        pagination
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactionById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const transaction = await transactionService.getTransactionById(
        id,
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { amount, type, category, date, description } = req.body;

      const updateData: Record<string, any> = {};
      if (amount !== undefined) updateData.amount = amount;
      if (type !== undefined) updateData.type = type;
      if (category !== undefined) updateData.category = category;
      if (date !== undefined) updateData.date = new Date(date);
      if (description !== undefined) updateData.description = description;

      const transaction = await transactionService.updateTransaction(
        id,
        userId,
        userRole,
        updateData
      );

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      await transactionService.deleteTransaction(id, userId, userRole);

      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
