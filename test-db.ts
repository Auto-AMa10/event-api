import { PrismaClient } from "./src/generated/prisma/index.js"; 
const prisma = new PrismaClient();
async function test() {
  const count = await prisma.event.count();
  console.log("Event count:", count);
  const categories = await prisma.category.findMany();
  console.log("Categories:", JSON.stringify(categories, null, 2));
  const events = await prisma.event.findMany({ 
    include: { category: true }
  });
  console.log("Events with Category:", JSON.stringify(events, null, 2));
  process.exit(0);
}
test();
