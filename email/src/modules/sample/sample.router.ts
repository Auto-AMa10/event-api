import { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { SampleController } from "./sample.controller.js";

export class SampleRouter {
  router: Router;

  constructor(
    private sampleController: SampleController,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.get(
      "/", // 1
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!), // 2
      this.sampleController.getSamples, // 3
    );

    this.router.get(
      "/:id", // 1
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!), // 2
      this.authMiddleware.verifyRole(["ADMIN"]), // 3
      this.sampleController.getSample, // 4
    );
  };

  getRouter = () => {
    return this.router;
  };
}
