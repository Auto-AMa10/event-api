import { Request, Response, NextFunction } from "express";
import { EventService } from "./event.service.js";
import { AuthRequest } from "../../utils/auth-middleware.js";
import { ApiError } from "../../utils/api-error.js";
import { BookEventDTO } from "./dto/book-event.dto.js";

export class EventController {
  constructor(private eventService: EventService) {}

  createEvent = async (req: Request, res: Response) => {
    // req.body
    const data = req.body;

    // thumbnail
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const thumbnail = files.thumbnail?.[0];
    if (!thumbnail) throw new ApiError("thumbnail is required", 400);

    // userId from payload token jwt
    const userId = Number(res.locals.user.id);

    const result = await this.eventService.createEvent(data, thumbnail, userId);
    res.status(200).send(result);
  };

bookEvents = async (req: Request, res: Response) => {
  const data: BookEventDTO = req.body;
  const userId = Number(res.locals.user.id);

  const result = await this.eventService.bookEvent(data, userId);

  res.status(200).send(result);
};

  getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(res.locals.user.id);
      const stats = await this.eventService.getDashboardStats(userId);
      res.status(200).json({ data: stats });
    } catch (err) {
      next(err);
    }
  };

  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await this.eventService.getEvents(req.query);
      res.status(200).json({ data: events });
    } catch (err) {
      next(err);
    }
  };

  getEventBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.eventService.getEventByslug(
        req.params.id as string,
      );
      res.status(200).json({ data: event });
    } catch (err) {
      next(err);
    }
  };
}
