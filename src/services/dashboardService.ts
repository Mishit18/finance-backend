import { TransactionType } from '../types';
import prisma from '../config/database';
import { DashboardSummary, CategoryTotal, MonthlyTrend } from '../types';

export class DashboardService {
  async getDashboardSummary(userId: string, userRole: string): Promise<DashboardSummary> {
    const where: Record<string, any> = { deletedAt: null };

    if (userRole !== 'ADMIN') {
      where.userId = userId;
    }

    // Use database aggregation for totals
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpense = expenseAgg._sum.amount || 0;
    const netBalance = totalIncome - totalExpense;

    // Category-wise totals using groupBy
    const categoryGroups = await prisma.transaction.groupBy({
      by: ['category', 'type'],
      where,
      _sum: { amount: true },
    });

    const categoryMap = new Map<string, { income: number; expense: number }>();
    categoryGroups.forEach(g => {
      const existing = categoryMap.get(g.category) || { income: 0, expense: 0 };
      if (g.type === TransactionType.INCOME) {
        existing.income = g._sum.amount || 0;
      } else {
        existing.expense = g._sum.amount || 0;
      }
      categoryMap.set(g.category, existing);
    });

    const categoryTotals: CategoryTotal[] = Array.from(categoryMap.entries()).map(
      ([category, totals]) => ({
        category,
        income: totals.income,
        expense: totals.expense,
        net: totals.income - totals.expense,
      })
    );

    // Recent activity (last 10 transactions)
    const recentTransactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 10,
    });

    const recentActivity = recentTransactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      description: t.description,
    }));

    // Monthly trends (last 6 months)
    const monthlyTrends = await this.calculateMonthlyTrends(where);

    return {
      totalIncome,
      totalExpense,
      netBalance,
      categoryTotals,
      recentActivity,
      monthlyTrends,
    };
  }

  private async calculateMonthlyTrends(where: Record<string, any>): Promise<MonthlyTrend[]> {
    // Get transactions from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await prisma.transaction.findMany({
      where: {
        ...where,
        date: { gte: sixMonthsAgo },
      },
      select: { amount: true, type: true, date: true },
      orderBy: { date: 'asc' },
    });

    const monthMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach(t => {
      const monthKey = new Date(t.date).toISOString().substring(0, 7);
      const existing = monthMap.get(monthKey) || { income: 0, expense: 0 };

      if (t.type === TransactionType.INCOME) {
        existing.income += t.amount;
      } else {
        existing.expense += t.amount;
      }

      monthMap.set(monthKey, existing);
    });

    return Array.from(monthMap.entries())
      .map(([month, totals]) => ({
        month,
        income: totals.income,
        expense: totals.expense,
        net: totals.income - totals.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getCategoryInsights(userId: string, userRole: string) {
    const where: Record<string, any> = { deletedAt: null };

    if (userRole !== 'ADMIN') {
      where.userId = userId;
    }

    const groups = await prisma.transaction.groupBy({
      by: ['category', 'type'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const insightsMap: Record<string, {
      category: string;
      totalIncome: number;
      totalExpense: number;
      transactionCount: number;
      net: number;
    }> = {};

    groups.forEach(g => {
      if (!insightsMap[g.category]) {
        insightsMap[g.category] = {
          category: g.category,
          totalIncome: 0,
          totalExpense: 0,
          transactionCount: 0,
          net: 0,
        };
      }

      if (g.type === TransactionType.INCOME) {
        insightsMap[g.category].totalIncome = g._sum.amount || 0;
      } else {
        insightsMap[g.category].totalExpense = g._sum.amount || 0;
      }

      insightsMap[g.category].transactionCount += g._count;
    });

    // Calculate net for each category
    Object.values(insightsMap).forEach(insight => {
      insight.net = insight.totalIncome - insight.totalExpense;
    });

    return Object.values(insightsMap);
  }
}
