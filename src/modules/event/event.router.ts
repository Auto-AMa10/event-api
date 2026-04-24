import { Router, Express, Response, Request } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { CreateEventDTO } from "./dto/create-event.dto.js";
import { EventController } from "./event.controller.js";
import { BookEventDTO } from "./dto/book-event.dto.js";

export class EventRouter {
  private router: Router;
  private app!: Express;

  constructor(
    private eventController: EventController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // this.router.get("/", this.eventController.getEvents);
    // this.router.get("/:id", this.eventController.getEventById);
    this.router.post(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["ORGANIZER"]),
      this.uploadMiddleware
        .upload()
        .fields([{ name: "thumbnail", maxCount: 1 }]),
      this.validationMiddleware.validateBody(CreateEventDTO),
      this.eventController.createEvent,
    );
    this.router.post(
      "/book",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.validationMiddleware.validateBody(BookEventDTO),
      this.eventController.bookEvents,
    );
  }

  public getRouter() {
    return this.router;
  }
}
