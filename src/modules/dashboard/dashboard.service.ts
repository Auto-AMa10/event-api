import { PrismaClient } from "../../generated/prisma/index.js";

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getDashboard(userId: number, eventId?: number) {
    const events = await this.prisma.event.findMany({
      where: {
        organizerId: userId,
        ...(eventId ? { id: eventId } : {}),
      },
      select: { id: true },
    });

    const eventIds = events.map((e) => e.id);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        eventId: { in: eventIds },
      },
    });

    const totalRevenue = transactions.reduce(
      (sum, t) => sum + t.totalPrice,
      0,
    );

    const pendingTransactions = transactions.filter(
      (t) =>
        t.status === "WAITING_PAYMENT" || t.status === "WAITING_ADMIN",
    ).length;

    const today = new Date().toDateString();

    const ticketsToday = transactions
      .filter((t) => new Date(t.createdAt).toDateString() === today)
      .reduce((sum, t) => sum + t.qty, 0);

    const activeEvents = events.length;

    const revenueChart = this.buildRevenueChart(transactions);

    return {
      totalRevenue,
      activeEvents,
      pendingTransactions,
      ticketsToday,
      pageViews: 5890,
      revenueChart,
    };
  }

  private buildRevenueChart(transactions: any[]) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return days.map((_, index) => {
      const revenue = transactions
        .filter((t) => new Date(t.createdAt).getDay() === index)
        .reduce((sum, t) => sum + t.totalPrice, 0);

      return {
        name: days[index],
        revenue,
      };
    });
  }
}