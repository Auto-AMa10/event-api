import { Request, Response, NextFunction } from "express";
import { EventService } from "./event.service.js";
import { AuthRequest } from "../../utils/auth-middleware.js";

export class EventController {
  constructor(private eventService: EventService) {}

  createEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const event = await this.eventService.createEvent(req.body, req.user.id);
      res.status(201).json({ message: "Event created successfully", data: event });
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

  getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.eventService.getEventById(Number(req.params.id));
      res.status(200).json({ data: event });
    } catch (err) {
      next(err);
    }
  };
}
