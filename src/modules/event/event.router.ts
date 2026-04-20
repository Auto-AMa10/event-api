import { Router } from "express";
import { EventController } from "./event.controller.js";
import { authMiddleware, organizerMiddleware } from "../../utils/auth-middleware.js";

export class EventRouter {
  private router: Router;

  constructor(private eventController: EventController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/", this.eventController.getEvents);
    this.router.get("/:id", this.eventController.getEventById);
    this.router.post("/", authMiddleware, organizerMiddleware, this.eventController.createEvent);
  }

  public getRouter() {
    return this.router;
  }
}
