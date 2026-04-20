import { Router } from "express";
import { TransactionController } from "./transaction.controller.js";
import { authMiddleware, organizerMiddleware } from "../../utils/auth-middleware.js";

export class TransactionRouter {
  private router: Router;

  constructor(private transactionController: TransactionController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/my", authMiddleware, this.transactionController.getMyTransactions);
    this.router.get("/:id", authMiddleware, this.transactionController.getById);
    this.router.post("/checkout", authMiddleware, this.transactionController.checkout);
    this.router.put("/:id/proof", authMiddleware, this.transactionController.uploadProof);
    this.router.put("/:id/status", authMiddleware, organizerMiddleware, this.transactionController.processTransaction);
  }

  public getRouter() {
    return this.router;
  }
}
