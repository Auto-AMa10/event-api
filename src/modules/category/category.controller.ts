import { Request, Response, NextFunction } from "express";
import { CategoryService } from "./category.service.js";

export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.categoryService.createCategory(req.body);

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.categoryService.getAllCategories();

      res.status(200).json(categories);
    } catch (err) {
      next(err);
    }
  };

getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const category = await this.categoryService.getCategoryBySlug(slug);

    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
};
}