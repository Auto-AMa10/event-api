import { Request, Response } from "express";
import { BlogService } from "./blog.service.js";
import { ApiError } from "../../utils/api-error.js";

export class BlogController {
  constructor(private blogService: BlogService) {}

  createBlog = async (req: Request, res: Response) => {
    // req.body
    const body = req.body;

    // thumbnail
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const thumbnail = files.thumbnail?.[0];
    if (!thumbnail) throw new ApiError("thumbnail is required", 400);

    // userId from payload token jwt
    const userId = res.locals.user.id;

    const result = await this.blogService.createBlog(body, thumbnail, userId);
    res.status(200).send(result);
  };
}
