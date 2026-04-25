import { Request, Response, NextFunction } from "express";
import { TransactionService } from "./transaction.service.js";
import { AuthRequest } from "../../utils/auth-middleware.js";

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  checkout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const transaction = await this.transactionService.checkout(Number(req.user.id), req.body);
      res.status(201).json({ message: "Checkout successful", data: transaction });
    } catch (err) {
      next(err);
    }
  };

  uploadProof = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // In MVP, we can assume req.body.paymentProof is a string URL (e.g. from Cloudinary) 
      const tx = await this.transactionService.uploadProof(Number(req.params.id), Number(req.user.id), req.body.paymentProof);
      res.status(200).json({ message: "Proof uploaded", data: tx });
    } catch (err) {
      next(err);
    }
  };

  processTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tx = await this.transactionService.processStatus(Number(req.params.id), req.body.action, Number(req.user.id));
      res.status(200).json({ message: `Transaction ${req.body.action} executed`, data: tx });
    } catch (err) {
      next(err);
    }
  };

  getMyTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const transactions = await this.transactionService.getMyTransactions(Number(req.user.id));
      res.status(200).json({ message: "Transactions fetched", data: transactions });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const transaction = await this.transactionService.getTransactionById(Number(req.params.id), Number(req.user.id));
      res.status(200).json({ data: transaction });
    } catch (err) {
      next(err);
    }
  };

  getPendingForOrganizer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const transactions = await this.transactionService.getPendingForOrganizer(Number(req.user.id));
      res.status(200).json({ data: transactions });
    } catch (err) {
      next(err);
    }
  };
  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.transactionService.deleteTransaction(Number(req.params.id), Number(req.user.id));
      res.status(200).json({ message: "Transaction deleted permanently" });
    } catch (err) {
      next(err);
    }
  };
}
