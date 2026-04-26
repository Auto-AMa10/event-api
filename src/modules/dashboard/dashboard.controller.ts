import { Response } from "express";
import { DashboardService } from "./dashboard.service.js";

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  getDashboard = async (req: any, res: Response) => {
    const userId = res.locals.user.id;

    const data = await this.dashboardService.getDashboard(userId);

    res.status(200).json(data);
  };
}