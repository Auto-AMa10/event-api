import { PrismaClient, Prisma } from "../../generated/prisma/index.js";
import { ApiError } from "../../utils/api-error.js";
import { generateSlug } from "../../utils/generate-slug.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { BookEventDTO } from "./dto/book-event.dto.js";
import { CreateEventDTO } from "./dto/create-event.dto.js";
import { GetEventsDTO } from "./dto/get-events.dto.js";

export class EventService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createEvent(
    data: CreateEventDTO,
    thumbnail: Express.Multer.File,
    userId: number,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { title: data.title },
    });

    if (event) throw new ApiError("title already in use", 400);

    const slug = generateSlug(data.title);

    const { secure_url } = await this.cloudinaryService.upload(thumbnail);

    await this.prisma.event.create({
      data: {
        ...data,
        slug: slug,
        thumbnail: secure_url,
        organizerId: userId,
        availableSeats: data.totalSeats,
      },
    });

    return { message: "Event Succsessfully created" };
  }

  async getDashboardStats(organizerId: number) {
    const revenueAggregation = await this.prisma.transaction.aggregate({
      _sum: { totalPrice: true },
      where: { event: { organizerId }, status: "DONE" },
    });
    const totalRevenue = revenueAggregation._sum.totalPrice || 0;

    const activeEvents = await this.prisma.event.count({
      where: { organizerId, endDate: { gte: new Date() } },
    });

    const pendingTransactions = await this.prisma.transaction.count({
      where: { event: { organizerId }, status: "WAITING_ADMIN" },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const ticketsSoldAggregation = await this.prisma.transaction.aggregate({
      _sum: { qty: true },
      where: {
        event: { organizerId },
        status: "DONE",
        updatedAt: { gte: startOfDay },
      },
    });
    const ticketsSoldToday = ticketsSoldAggregation._sum.qty || 0;

    const pageViews = 5890; // Mocked page views for now

    const chartData: { name: string; revenue: number; dateString: string }[] =
      [];
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      chartData.push({
        name: days[d.getDay()],
        revenue: 0,
        dateString: d.toISOString().split("T")[0],
      });
    }

    const pastWeekDate = new Date();
    pastWeekDate.setDate(pastWeekDate.getDate() - 6);
    pastWeekDate.setHours(0, 0, 0, 0);

    const txs = await this.prisma.transaction.findMany({
      where: {
        event: { organizerId },
        status: "DONE",
        updatedAt: { gte: pastWeekDate },
      },
      select: { totalPrice: true, updatedAt: true },
    });

    txs.forEach((tx) => {
      const dateString = tx.updatedAt.toISOString().split("T")[0];
      const match = chartData.find((c) => c.dateString === dateString);
      if (match) {
        match.revenue += tx.totalPrice;
      }
    });

    return {
      totalRevenue,
      activeEvents,
      pendingTransactions,
      ticketsSoldToday,
      pageViews,
      chartData,
    };
  }

  async getEvents(query: GetEventsDTO) {
    const { page, take, category, location, sortBy, sortOrder } = query;

    const whereClause: any = {};

    // CATEGORY (relation filter)
    if (category) {
      whereClause.category = {
        is: {
          slug: category, // or name
        },
      };
    }

    // LOCATION (string filter)
    if (location) {
      whereClause.location = {
        contains: location,
        mode: "insensitive",
      };
    }

    return this.prisma.event.findMany({
      where: whereClause,
      skip: (page - 1) * take,
      take,
      orderBy: sortBy
        ? { [sortBy]: sortOrder || "desc" }
        : { createdAt: "desc" },
      include: {
        organizer: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
        category: true,
      },
    });
  }

  async getEventByslug(idOrSlug: string | number) {
    const isNumeric = !isNaN(Number(idOrSlug));
    const event = await this.prisma.event.findUnique({
      where: isNumeric ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) },
      include: {
        organizer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!event) throw new ApiError("Event not found", 404);
    return event;
  }
}
