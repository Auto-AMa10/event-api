import { Router } from "express";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { CategoryController } from "./category.controller.js";
import { CreateCategoryDTO } from "./dto/create-category.dto.js";

export class CategoryRouter {
  private router: Router;

  constructor(
    private categoryController: CategoryController,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // create category 
    this.router.post(
      "/",
      this.validationMiddleware.validateBody(CreateCategoryDTO),
      this.categoryController.createCategory,
    );

    // get all categories
    this.router.get(
      "/",
      this.categoryController.getAllCategories,
    );

    // get by slug 
    this.router.get(
      "/:slug",
      this.categoryController.getCategoryBySlug,
    );
  }

  public getRouter() {
    return this.router;
  }
}