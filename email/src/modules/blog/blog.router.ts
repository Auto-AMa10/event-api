import { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { BlogController } from "./blog.controller.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { CreateBlogDTO } from "./dto/create-blog.dto.js";

export class BlogRouter {
  router: Router;

  constructor(
    private blogController: BlogController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes = () => {
    this.router.post(
      "/",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.authMiddleware.verifyRole(["USER"]),
      this.uploadMiddleware.upload().fields([{ name: "thumbnail", maxCount: 1 }]),
      this.validationMiddleware.validateBody(CreateBlogDTO),
      this.blogController.createBlog,
    );
  };

  getRouter = () => {
    return this.router;
  };
}
