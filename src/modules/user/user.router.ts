import { Router } from "express";
import { UserController } from "./user.controller.js";
import { authMiddleware } from "../../utils/auth-middleware.js";

export class UserRouter {
  private router: Router;

  constructor(private userController: UserController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.put("/profile", authMiddleware, this.userController.updateProfile);
    this.router.post("/change-password", authMiddleware, this.userController.changePassword);
  }

  public getRouter() {
    return this.router;
  }
}
