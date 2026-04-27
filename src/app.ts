import cors from "cors";
import express, { Express } from "express";
import "reflect-metadata";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma.js";
import { AuthRouter } from "./modules/auth/auth.router.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { EventRouter } from "./modules/event/event.router.js";
import { EventController } from "./modules/event/event.controller.js";
import { EventService } from "./modules/event/event.service.js";
import { TransactionRouter } from "./modules/transaction/transaction.router.js";
import { TransactionController } from "./modules/transaction/transaction.controller.js";
import { TransactionService } from "./modules/transaction/transaction.service.js";
import { UserService } from "./modules/user/user.service.js";
import { UserController } from "./modules/user/user.controller.js";
import { UserRouter } from "./modules/user/user.router.js";
import { globalError, notFoundError } from "./utils/errors.js";
import path from "path";
import { fileURLToPath } from "url";
import { MailService } from "./modules/mail/templates/mail.service.js";
import { AuthMiddleware } from "./middlewares/auth.middleware.js";
import { ValidationMiddleware } from "./middlewares/validation.middleware.js";
import { UploadMiddleware } from "./middlewares/upload.middleware.js";

import { CloudinaryService } from "./modules/cloudinary/cloudinary.service.js";
import { CategoryService } from "./modules/category/category.service.js";
import { CategoryController } from "./modules/category/category.controller.js";
import { CategoryRouter } from "./modules/category/category.router.js";
import { DashboardService } from "./modules/dashboard/dashboard.service.js";
import { DashboardController } from "./modules/dashboard/dashboard.controller.js";
import { DashboardRouter } from "./modules/dashboard/dashboard.router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class App {
  app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.app.use(cookieParser());
    this.registerModules();
    this.errors();
  }

  private configure() {
    this.app.use(
      cors({
        origin: process.env.BASE_URL_FE,
        credentials: true,
      }),
    );
    this.app.use(express.json({ limit: "500mb" }));
    this.app.use(express.urlencoded({ limit: "500mb", extended: true }));
  }
  private registerModules() {
    // services
    const mailService = new MailService();
    const cloudinaryService = new CloudinaryService();
    const authService = new AuthService(prisma, mailService);
    const eventService = new EventService(prisma, cloudinaryService);
    const categoryService = new CategoryService(prisma);
    const dashboardService = new DashboardService(prisma);
    const transactionService = new TransactionService(prisma,cloudinaryService);
    const userService = new UserService(prisma);

    // controllers
    const authController = new AuthController(authService);
    const eventController = new EventController(eventService);
    const categoryController = new CategoryController(categoryService);
    const dashboardController = new DashboardController(dashboardService);
    const transactionController = new TransactionController(transactionService);
    const userController = new UserController(userService);

    // middlewares
    const authMiddleware = new AuthMiddleware();
    const validationMiddleware = new ValidationMiddleware();
    const uploadMiddleware = new UploadMiddleware();

    // routes
    const authRouter = new AuthRouter(
      authController,
      validationMiddleware,
      authMiddleware,
    );
    const eventRouter = new EventRouter(
      eventController,
      authMiddleware,
      uploadMiddleware,
      validationMiddleware,
    );
    const categoryRouter = new CategoryRouter(
      categoryController,
      validationMiddleware,
    );
    const dashboardRouter = new DashboardRouter(
      dashboardController,
      authMiddleware,
    );
    const transactionRouter = new TransactionRouter(
      transactionController,
      authMiddleware,
      validationMiddleware,
      uploadMiddleware,
    );
    const userRouter = new UserRouter(userController);

    // entry point
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/events", eventRouter.getRouter());
    this.app.use("/category", categoryRouter.getRouter());
    this.app.use("/dashboard", dashboardRouter.getRouter());
    this.app.use("/transactions", transactionRouter.getRouter());
    this.app.use("/users", userRouter.getRouter());
    this.app.use("/uploads", express.static("uploads"));
  }

  private errors() {
    this.app.use(globalError);
    this.app.use(notFoundError);
  }

start() {
  const PORT = process.env.PORT || 8000;
  this.app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
  }

