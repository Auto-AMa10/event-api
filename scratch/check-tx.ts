import { PrismaClient } from "../src/generated/prisma/index.js";
const prisma = new PrismaClient();

async function check() {
  const txs = await prisma.transaction.findMany({
    include: { event: true, user: true }
  });
  console.log("Total Transactions:", txs.length);
  txs.forEach(t => {
    console.log(`ID: ${t.id}, Status: ${t.status}, Event: ${t.event.title}, OrganizerID: ${t.event.organizerId}, User: ${t.user.name}`);
  });
}

check();
