import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DashboardService } from '../services/dashboardService';

const dashboardService = new DashboardService();

export class DashboardController {
  async getDashboardSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const summary = await dashboardService.getDashboardSummary(userId, userRole);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const insights = await dashboardService.getCategoryInsights(userId, userRole);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  }
}
