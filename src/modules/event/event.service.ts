import { PrismaClient, Prisma } from "../../generated/prisma/index.js";
import { ApiError } from "../../utils/api-error.js";
import { generateSlug } from "../../utils/generate-slug.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { BookEventDTO } from "./dto/book-event.dto.js";
import { CreateEventDTO } from "./dto/create-event.dto.js";

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
  // 1. Prevent duplicate booking 
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

  // 2. Atomically decrease seat ONLY if available
  const updatedEvent = await this.prisma.event.updateMany({
    where: {
      id: data.eventId,
      availableSeats: {
        gt: 0,
      },
    },
    data: {
      availableSeats: {
        decrement: 1,
      },
    },
  });

  // 3. If no seat updated → sold out
  if (updatedEvent.count === 0) {
    throw new ApiError("No seats available", 400);
  }

  // 4. Create booking
  await this.prisma.booking.create({
    data: {
      eventId: data.eventId,
      userId,
    },
  });

  return { message: "Ticket booked successfully" };
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
        organizer: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" }, // default ordering
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
