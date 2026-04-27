import {
  PrismaClient,
  TransactionStatus,
} from "../../generated/prisma/index.js";
import { ApiError } from "../../utils/api-error.js";
import { CreateCheckoutDTO } from "./dto/create.checkout.dto.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";

export class TransactionService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}

  async checkout(userId: number, data: CreateCheckoutDTO) {
    const { eventId, qty, pointsUsed, couponCode, voucherCode } = data;

    const safePointsUsed = pointsUsed ?? 0;

    if (qty <= 0) throw new ApiError("Invalid quantity", 400);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Get event
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new ApiError("Event not found", 404);

      if (event.availableSeats < qty) {
        throw new ApiError("Not enough seats available", 400);
      }

      // 2. Check seats
      if (event.availableSeats < qty) {
        throw new ApiError("Not enough seats available", 400);
      }

      // 3. Get user
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new ApiError("User not found", 404);

      if (safePointsUsed > 0 && user.pointsBalance < safePointsUsed) {
        throw new ApiError("Insufficient points", 400);
      }

      // 5. Discounts
      let discountApplied = 0;

      // coupon
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode },
        });

        if (coupon && coupon.isActive && coupon.expiresAt > new Date()) {
          discountApplied += Math.floor(
            (event.price * qty * coupon.discountPercent) / 100,
          );
        }
      }

      // voucher
      if (voucherCode) {
        const voucher = await tx.voucher.findUnique({
          where: { code: voucherCode },
        });

        if (
          voucher &&
          voucher.eventId === eventId &&
          voucher.isActive &&
          voucher.expiresAt > new Date()
        ) {
          discountApplied += voucher.discountAmount;
        }
      }

      let totalPrice = event.price * qty - discountApplied - safePointsUsed;

      if (totalPrice < 0) totalPrice = 0;

      if (safePointsUsed > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            pointsBalance: user.pointsBalance - safePointsUsed,
          },
        });
      }

      await tx.event.update({
        where: { id: eventId },
        data: {
          availableSeats: event.availableSeats - qty,
        },
      });

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      return tx.transaction.create({
        data: {
          userId,
          eventId,
          qty,
          totalPrice,
          discountApplied,
          pointsUsed: safePointsUsed,
          expiresAt,
          status:
            totalPrice === 0
              ? TransactionStatus.DONE
              : TransactionStatus.WAITING_PAYMENT,
        },
      });
    });
  }

  async uploadProof(id: number, userId: number, file: Express.Multer.File) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!tx || tx.userId !== userId) {
      throw new ApiError("Transaction not found", 404);
    }

    const result = await this.cloudinaryService.upload(file);

    if (!tx || tx.userId !== userId)
      throw new ApiError("Transaction not found", 404);

    const updatedTx = await this.prisma.transaction.update({
      where: { id },
      data: {
        paymentProof: result.secure_url,
        status: TransactionStatus.WAITING_ADMIN,
      },
    });

    // --- AUTO-ACCEPT BOT ---
    // Automatically approve after 5 seconds to simulate processing
    setTimeout(async () => {
      try {
        await this.prisma.transaction.update({
          where: { id },
          data: { status: TransactionStatus.DONE }
        });
        console.log(`[Auto-Accept] Transaction ID ${id} has been automatically approved.`);
      } catch (err) {
        console.error(`[Auto-Accept] Failed to auto-approve ID ${id}:`, err);
      }
    }, 5000);

    return updatedTx;
  }

  async statusTransaction(
    id: number,
    action: "ACCEPT" | "REJECT",
    organizerId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { event: true, user: true },
      });

      if (!transaction) throw new ApiError("Transaction not found", 404);

      if (transaction.event.organizerId !== organizerId) {
        throw new ApiError("Forbidden", 403);
      }

      if (transaction.status !== TransactionStatus.WAITING_ADMIN) {
        throw new ApiError("Invalid state", 400);
      }

      // ACCEPT
      if (action === "ACCEPT") {
        return tx.transaction.update({
          where: { id },
          data: { status: TransactionStatus.DONE },
        });
      }

      // REJECT → rollback everything
      if (action === "REJECT") {
        await tx.event.update({
          where: { id: transaction.eventId },
          data: {
            availableSeats: {
              increment: transaction.qty,
            },
          },
        });

        // return points
        if (transaction.pointsUsed > 0) {
          await tx.user.update({
            where: { id: transaction.userId },
            data: {
              pointsBalance:
                transaction.user.pointsBalance + transaction.pointsUsed,
            },
          });
        }

        return tx.transaction.update({
          where: { id },
          data: { status: TransactionStatus.REJECTED },
        });
      }
    });
  }

  // (unchanged other methods)
}
