import { hash, verify } from "argon2";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "../../../../src/generated/prisma/index.js";
import { ApiError } from "../../utils/api-error.js";
import {
  EXPIRED_7_DAY,
  EXPIRED_ACCESS_TOKEN_JWT,
  EXPIRED_REFRESH_TOKEN_JWT,
} from "./constants.js";

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  register = async (body: User) => {
    const user = await this.prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (user) {
      throw new ApiError("Email already exist", 400);
    }

    const hashedPassword = await hash(body.password);

    const referralCode = body.name.substring(0, 3).toUpperCase() + Math.random().toString(36).substring(2, 7).toUpperCase();

    await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        referralCode: referralCode,
      },
    });

    return {
      message: "register success",
    };
  };

  login = async (body: User) => {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) throw new ApiError("Invalid credentials", 400);

    const isPassMatch = await verify(user.password, body.password);

    if (!isPassMatch) throw new ApiError("Invalid credentials", 400);

    const payload = { id: user.id, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: EXPIRED_ACCESS_TOKEN_JWT,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH!, {
      expiresIn: EXPIRED_REFRESH_TOKEN_JWT,
    });

    // RefreshToken table was removed from schema
    // Skipping DB refresh token upsert

    const { password, ...userWithoutPassword } = user; // remove property password

    return { user: userWithoutPassword, accessToken, refreshToken };
  };

  logout = async (refreshToken?: string) => {
    if (!refreshToken) return;

    // Removed refresh token deletion query since table is no longer in schema

    return { message: "Logout success" };
  };

  refresh = async (refreshToken?: string) => {
    if (!refreshToken) throw new ApiError("No refresh token", 400);

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH!);
    } catch (err) {
      throw new ApiError("Refresh token expired or invalid", 400);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) throw new ApiError("User not found", 400);

    const payload = {
      id: user.id,
      role: user.role,
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: EXPIRED_ACCESS_TOKEN_JWT,
    });

    return { accessToken: newAccessToken };
  };
}
