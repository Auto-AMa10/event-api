import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import { EventService } from "./event.service.js";
import { plainToInstance } from "class-transformer";
import { GetEventsDTO } from "./dto/get-events.dto.js";
import { validateOrReject } from "class-validator";

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
    const userId = res.locals.user.id;

    const result = await this.eventService.createEvent(data, thumbnail, userId);
    res.status(200).send(result);
  };

  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToInstance(GetEventsDTO, req.query);
      await validateOrReject(dto);
      const events = await this.eventService.getEvents(dto);

      res.status(200).json({
        message: "Events fetched",
        data: events,
      });
    } catch (err) {
      next(err);
    }
  };

  getEventBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.eventService.getEventByslug(
        Number(req.params.id),
      );
      res.status(200).json({ data: event });
    } catch (err) {
      next(err);
    }
  };
}
