import { PrismaClient, Prisma } from "../../generated/prisma/index.js";
import { ApiError } from "../../utils/api-error.js";

export class EventService {
  constructor(private prisma: PrismaClient) {}

  async createEvent(data: any, organizerId: number) {
    const { title, description, price, startDate, endDate, location, category, availableSeats } = data;
    
    return await this.prisma.event.create({
      data: {
        title,
        description,
        price,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        category,
        totalSeats: availableSeats,
        availableSeats,
        organizerId
      }
    });
  }

  async getEvents(query: any) {
    const { search, category, location } = query;
    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.title = { contains: search as string };
    }
    if (category) {
      where.category = { equals: category as string };
    }
    if (location) {
      where.location = { contains: location as string };
    }

    return await this.prisma.event.findMany({
      where,
      include: {
        organizer: { select: { name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" } // default ordering
    });
  }

  async getEventById(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    if (!event) throw new ApiError("Event not found", 404);
    return event;
  }
}
