import { Request } from 'express';

export type Role = 'VIEWER' | 'ANALYST' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type TransactionType = 'INCOME' | 'EXPENSE';

export const Role = {
  VIEWER: 'VIEWER' as Role,
  ANALYST: 'ANALYST' as Role,
  ADMIN: 'ADMIN' as Role,
};

export const UserStatus = {
  ACTIVE: 'ACTIVE' as UserStatus,
  INACTIVE: 'INACTIVE' as UserStatus,
};

export const TransactionType = {
  INCOME: 'INCOME' as TransactionType,
  EXPENSE: 'EXPENSE' as TransactionType,
};

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  categoryTotals: CategoryTotal[];
  recentActivity: RecentTransaction[];
  monthlyTrends: MonthlyTrend[];
}

export interface CategoryTotal {
  category: string;
  income: number;
  expense: number;
  net: number;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  type?: TransactionType;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RecentTransaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: Date;
  description: string | null;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}
