import { Router } from "express";
import { AuthController } from "./auth.controller.js";

export class AuthRouter {
  private router: Router;

  constructor(private authController: AuthController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/register", this.authController.register);
    this.router.post("/login", this.authController.login);
  }

  public getRouter() {
    return this.router;
  }
}
