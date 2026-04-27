import { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { TransactionController } from "./transaction.controller.js";

export class TransactionRouter {
  private router: Router;
  private app!: Express;

  constructor(
    private transactionController: TransactionController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
    private uploadMiddleware: UploadMiddleware,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // checkout
    this.router.post(
      "/checkout",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.checkout,
    );

    // upload payment proof (FILE UPLOAD REQUIRED)
    this.router.put(
      "/:id/proof",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.uploadMiddleware.upload().single("proof"),
      this.transactionController.uploadProof,
    );

    // organizer process transaction
    this.router.patch(
      "/:id/status",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ORGANIZER"]),
      this.transactionController.statusTransaction,
    );

    // get my transactions
    this.router.get(
      "/me",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.getMyTransactions,
    );

    // get transaction by id
    this.router.get(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.getTransactionById,
    );

    // organizer pending transactions
    this.router.get(
      "/organizer/pending",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ORGANIZER"]),
      this.transactionController.getPendingForOrganizer,
    );

    // delete transaction
    this.router.delete(
      "/:id",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.transactionController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}