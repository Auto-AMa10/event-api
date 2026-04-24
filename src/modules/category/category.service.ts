import { PrismaClient } from "@prisma/client";
import { ApiError } from "../../utils/api-error.js";
import { generateSlug } from "../../utils/generate-slug.js";
import { CreateCategoryDTO } from "./dto/create-category.dto.js";

export class CategoryService {
  constructor(private prisma: PrismaClient) {}

async createCategory(data: CreateCategoryDTO) {
  const slug = generateSlug(data.name);

  const existing = await this.prisma.category.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new ApiError("Category already exists", 400);
  }

  return this.prisma.category.create({
    data: {
      name: data.name,
      slug,
    },
  });
}

  async getAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { id: "asc" },
    });
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new ApiError("Category not found", 404);
    }

    return category;
  }
}