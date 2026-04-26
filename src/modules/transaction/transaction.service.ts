import {
  PrismaClient,
  TransactionStatus,
} from "../../generated/prisma/index.js";
import { ApiError } from "../../utils/api-error.js";
import { CreateCheckoutDTO } from "./dto/create.checkout.dto.js";

export class TransactionService {
  constructor(private prisma: PrismaClient) {}

  async checkout(userId: number, data: CreateCheckoutDTO) {
    const { eventId, qty, pointsUsed, couponCode, voucherCode } = data;

    const safePointsUsed = pointsUsed ?? 0;

    if (qty <= 0) throw new ApiError("Invalid quantity", 400);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Get event
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new ApiError("Event not found", 404);

      // 2. Check seats
      if (event.availableSeats < qty) {
        throw new ApiError("Not enough seats available", 400);
      }

      // 3. Get user
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new ApiError("User not found", 404);

      // 4. Check points
      if (
        safePointsUsed > 0 &&
        user.pointsBalance < safePointsUsed
      ) {
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

      // 6. Final price
      let totalPrice =
        event.price * qty - discountApplied - safePointsUsed;

      if (totalPrice < 0) totalPrice = 0;

      // 7. Deduct points
      if (safePointsUsed > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            pointsBalance: user.pointsBalance - safePointsUsed,
          },
        });
      }

      // 8. Reserve seats (temporary lock)
      await tx.event.update({
        where: { id: eventId },
        data: {
          availableSeats: event.availableSeats - qty,
        },
      });

      // 9. Expiry time (2 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      // 10. Create transaction
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

  async uploadProof(id: number, userId: number, paymentProof: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!tx || tx.userId !== userId)
      throw new ApiError("Transaction not found", 404);

    const updatedTx = await this.prisma.transaction.update({
      where: { id },
      data: {
        paymentProof,
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

  async processStatus(
    id: number,
    action: "ACCEPT" | "REJECT",
    organizerId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { event: true, user: true },
      });

      if (!transaction)
        throw new ApiError("Transaction not found", 404);

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
        // return seats
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
                transaction.user.pointsBalance +
                transaction.pointsUsed,
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

  async getMyTransactions(userId: number) {
    // 1. Find expired transactions to restore resources before deleting
    const expired = await this.prisma.transaction.findMany({
      where: {
        userId,
        status: "WAITING_PAYMENT",
        expiresAt: { lt: new Date() }
      }
    });

    for (const tx of expired) {
      await this.prisma.$transaction(async (prismaTx) => {
        // Return seats
        await prismaTx.event.update({
          where: { id: tx.eventId },
          data: { availableSeats: { increment: tx.qty } }
        });
        // Return points
        if (tx.pointsUsed > 0) {
          await prismaTx.user.update({
            where: { id: tx.userId },
            data: { pointsBalance: { increment: tx.pointsUsed } }
          });
        }
        // Permanent Delete
        await prismaTx.transaction.delete({ where: { id: tx.id } });
      });
    }

    // 2. Return remaining valid transactions
    return await this.prisma.transaction.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTransactionById(id: number, userId: number) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!tx || tx.userId !== userId) {
      throw new ApiError("Transaction not found", 404);
    }

    return tx;
  }

  async getPendingForOrganizer(organizerId: number) {
    console.log("Fetching pending transactions for organizer:", organizerId);
    return await this.prisma.transaction.findMany({
      where: {
        status: { in: [TransactionStatus.WAITING_ADMIN, TransactionStatus.DONE] },
        event: { organizerId },
      },
      include: {
        event: { select: { title: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteTransaction(id: number, userId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { event: true }
      });

      if (!transaction || transaction.userId !== userId) {
        throw new ApiError("Transaction not found", 404);
      }

      // If it was still active, restore seats and points
      if (transaction.status === "WAITING_PAYMENT" || transaction.status === "WAITING_ADMIN") {
        await tx.event.update({
          where: { id: transaction.eventId },
          data: { availableSeats: { increment: transaction.qty } }
        });

        if (transaction.pointsUsed > 0) {
          await tx.user.update({
            where: { id: transaction.userId },
            data: { pointsBalance: { increment: transaction.pointsUsed } }
          });
        }
      }

      return await tx.transaction.delete({ where: { id } });
    });
  }
}
