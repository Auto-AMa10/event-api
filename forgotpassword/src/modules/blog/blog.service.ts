import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { generateSlug } from "../../utils/generate-slug.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { CreateBlogDTO } from "./dto/create-blog.dto.js";
import { GetBlogsDTO } from "./dto/get-blogs.dto.js";

export class BlogService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}

  getBlogs = async (query: GetBlogsDTO) => {
    const { page, sortBy, sortOrder, take, search } = query;

    const whereClause: Prisma.BlogWhereInput = {};

    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }

    const blogs = await this.prisma.blog.findMany({
      where: whereClause,
      take: take,
      skip: (page - 1) * take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const total = await this.prisma.blog.count({
      where: whereClause,
    });

    return {
      data: blogs,
      meta: { page, take, total },
    };
  };

  getBlogBySlug = async (slug: string) => {
    const blog = await this.prisma.blog.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!blog) throw new ApiError("blog not found", 404);

    return blog;
  };

  createBlog = async (
    body: CreateBlogDTO,
    thumbnail: Express.Multer.File,
    userId: number,
  ) => {
    const blog = await this.prisma.blog.findUnique({
      where: { title: body.title },
    });

    if (blog) throw new ApiError("title already in use", 400);

    const slug = generateSlug(body.title);

    const { secure_url } = await this.cloudinaryService.upload(thumbnail);

    await this.prisma.blog.create({
      data: {
        ...body,
        slug: slug,
        thumbnail: secure_url,
        userId: userId,
      },
    });

    return { message: "create blog success" };
  };
}
