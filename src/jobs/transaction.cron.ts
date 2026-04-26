import cron from "node-cron";
import { PrismaClient, TransactionStatus } from "../generated/prisma/index.js";
import { rollbackTransaction } from "../modules/transaction/transaction.utils.js";

const prisma = new PrismaClient();

/**
 * Runs every 5 minutes
 */
cron.schedule("*/5 * * * *", async () => {
  const now = new Date();

  // 1. EXPIRE unpaid transactions (2 hours)
  const expired = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.WAITING_PAYMENT,
      expiresAt: { lt: now },
    },
  });

  for (const tx of expired) {
    await rollbackTransaction(prisma, tx);

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: TransactionStatus.EXPIRED },
    });
  }

  // 2. CANCEL admin timeout (3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const stuck = await prisma.transaction.findMany({
    where: {
      status: TransactionStatus.WAITING_ADMIN,
      createdAt: { lt: threeDaysAgo },
    },
  });

  for (const tx of stuck) {
    await rollbackTransaction(prisma, tx);

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: TransactionStatus.CANCELED },
    });
  }
});
