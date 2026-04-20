import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import { BlogService } from "./blog.service.js";
import { GetBlogsDTO } from "./dto/get-blogs.dto.js";

export class BlogController {
  constructor(private blogService: BlogService) {}

  getBlogs = async (req: Request, res: Response) => {
    const query = plainToInstance(GetBlogsDTO, req.query);
    const result = await this.blogService.getBlogs(query);
    res.status(200).send(result);
  };

  getBlogBySlug = async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const result = await this.blogService.getBlogBySlug(slug);
    res.status(200).send(result);
  };

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
