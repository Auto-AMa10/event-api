import { Router, Express } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { TransactionController } from "./transaction.controller.js";

export class TransactionRouter {
  private router: Router;
  private app!: Express;

  constructor(
    private transactionController: TransactionController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      "/checkout",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.checkout,
    );

    this.router.post(
      "/:id/upload-proof",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.uploadProof,
    );

    this.router.patch(
      "/:id/process",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ORGANIZER"]),
      this.transactionController.processTransaction,
    );

    this.router.get(
      "/me",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.getMyTransactions,
    );

    this.router.get(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.getTransactionById,
    );
  }

  public getRouter() {
    return this.router;
  }
}