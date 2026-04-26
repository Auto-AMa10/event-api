import { PrismaClient, TransactionStatus } from "../../generated/prisma/index.js";

export async function rollbackTransaction(prisma: PrismaClient, transaction: any) {
  // restore seats
  await prisma.event.update({
    where: { id: transaction.eventId },
    data: {
      availableSeats: {
        increment: transaction.qty,
      },
    },
  });

  // restore points
  if (transaction.pointsUsed > 0) {
    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        pointsBalance: {
          increment: transaction.pointsUsed,
        },
      },
    });
  }

  // optional: voucher/coupon rollback handled later if you track usage logs

  return true;
}