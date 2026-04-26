import { Router, Express } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";

export class DashboardRouter {
  private router: Router;

  constructor(
    private dashboardController: DashboardController,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ORGANIZER"]),
      this.dashboardController.getDashboard,
    );
  }

  public getRouter() {
    return this.router;
  }
}
