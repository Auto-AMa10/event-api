import { NextFunction, Request, Response } from "express";
import { TransactionService } from "./transaction.service.js";
import { AuthRequest } from "../../utils/auth-middleware.js";

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  checkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res.locals.user.id;
      const result = await this.transactionService.checkout(userId, req.body);

      res.status(201).json({
        message: "Checkout successful",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  uploadProof = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res.locals.user.id;

      const file = req.file;

      if (!file) {
        return res.status(400).json({
          message: "payment proof file is required",
        });
      }

      const result = await this.transactionService.uploadProof(
        Number(req.params.id),
        userId,
        file,
      );

      res.status(200).json({
        message: "Proof uploaded",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  statusTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const organizerId = res.locals.user.id;
      const result = await this.transactionService.statusTransaction(
        Number(req.params.id),
        req.body.action,
        organizerId,
      );

      res.status(200).json({
        message: `Transaction ${req.body.action}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getMyTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = res.locals.user.id;
      const result = await this.transactionService.getMyTransactions(userId);

      res.status(200).json({
        message: "Transactions fetched",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getTransactionById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = res.locals.user.id;
      const result = await this.transactionService.getTransactionById(
        Number(req.params.id),
        userId,
      );

      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getPendingForOrganizer = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const transactions = await this.transactionService.getPendingForOrganizer(
        Number(req.user.id),
      );
      res.status(200).json({ data: transactions });
    } catch (err) {
      next(err);
    }
  };
  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.transactionService.deleteTransaction(
        Number(req.params.id),
        Number(req.user.id),
      );
      res.status(200).json({ message: "Transaction deleted permanently" });
    } catch (err) {
      next(err);
    }
  };
}
