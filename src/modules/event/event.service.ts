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

  async bookEvent(data: BookEventDTO, userId: number) {
    const existing = await this.prisma.booking.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId: data.eventId,
        },
      },
    });

    if (existing) {
      throw new ApiError("You already booked this event", 400);
    }

    const event = await this.prisma.event.findUnique({
      where: { id: data.eventId },
    });

    if (!event) {
      throw new ApiError("Event not found", 404);
    }

    const updatedEvent = await this.prisma.event.updateMany({
      where: {
        id: data.eventId,
        availableSeats: { gt: 0 },
      },
      data: {
        availableSeats: {
          decrement: 1,
        },
      },
    });

    if (updatedEvent.count === 0) {
      throw new ApiError("No seats available", 400);
    }

    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min hold

    await this.prisma.booking.create({
      data: {
        eventId: data.eventId,
        userId,
        expiresAt,
        status: "RESERVED",
      },
    });

    return { message: "Seat reserved. Complete payment within 15 minutes." };
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

  async getEventByslug(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!event) throw new ApiError("Event not found", 404);
    return event;
  }
}
