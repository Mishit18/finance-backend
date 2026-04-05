import { Router } from 'express';
import { Role } from '../types';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary (all authenticated users)
 *     description: Returns total income, total expenses, net balance, category-wise totals, recent activity, and monthly trends. Non-admins see only their own data.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpense:
 *                       type: number
 *                     netBalance:
 *                       type: number
 *                     categoryTotals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           income:
 *                             type: number
 *                           expense:
 *                             type: number
 *                           net:
 *                             type: number
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     monthlyTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: "2024-01"
 *                           income:
 *                             type: number
 *                           expense:
 *                             type: number
 *                           net:
 *                             type: number
 *       401:
 *         description: Not authenticated
 */
router.get(
  '/summary',
  authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN),
  dashboardController.getDashboardSummary
);

/**
 * @swagger
 * /api/dashboard/insights:
 *   get:
 *     summary: Get category insights (Analyst/Admin only)
 *     description: Returns per-category breakdown with income, expense, net, and transaction count.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       totalIncome:
 *                         type: number
 *                       totalExpense:
 *                         type: number
 *                       transactionCount:
 *                         type: integer
 *                       net:
 *                         type: number
 *       403:
 *         description: Viewers cannot access insights
 */
router.get(
  '/insights',
  authorize(Role.ANALYST, Role.ADMIN),
  dashboardController.getCategoryInsights
);

export default router;
