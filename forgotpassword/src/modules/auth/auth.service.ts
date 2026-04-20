import { hash, verify } from "argon2";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { MailService } from "../mail/mail.service.js";
import {
  EXPIRED_7_DAY,
  EXPIRED_ACCESS_TOKEN_JWT,
  EXPIRED_REFRESH_TOKEN_JWT,
  EXPIRED_RESET_TOKEN_JWT,
} from "./constants.js";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto.js";
import { LoginDTO } from "./dto/login.dto.js";
import { RegisterDTO } from "./dto/register.dto.js";

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private mailService: MailService,
  ) {}

  register = async (body: RegisterDTO) => {
    const user = await this.prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (user) {
      throw new ApiError("Email already exist", 400);
    }

    const hashedPassword = await hash(body.password);

    await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
    });

    await this.mailService.sendMail({
      to: body.email,
      subject: "Welcome to MyApp",
      templateName: "welcome",
      context: {
        name: body.name,
      },
    });

    return {
      message: "register success",
    };
  };

  login = async (body: LoginDTO) => {
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

    await this.prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: {
        token: refreshToken,
        expiredAt: EXPIRED_7_DAY,
      },
      create: {
        token: refreshToken,
        expiredAt: EXPIRED_7_DAY,
        userId: user.id,
      },
    });

    const { password, ...userWithoutPassword } = user; // remove property password

    return { user: userWithoutPassword, accessToken, refreshToken };
  };

  logout = async (refreshToken?: string) => {
    if (!refreshToken) return;

    await this.prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    return { message: "Logout success" };
  };

  refresh = async (refreshToken?: string) => {
    if (!refreshToken) throw new ApiError("No refresh token", 400);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored) throw new ApiError("Refresh token not found", 400);

    const isExpired = stored.expiredAt < new Date();

    if (isExpired) throw new ApiError("Refresh token expired", 400);

    const payload = {
      id: stored.user.id,
      role: stored.user.role,
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: EXPIRED_ACCESS_TOKEN_JWT,
    });

    return { accessToken: newAccessToken };
  };

  forgotPassword = async (body: ForgotPasswordDTO) => {
    // 1. cek dulu emailnya, terdaftar atau tidak
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    // 2. kalo tidak return success
    if (!user) {
      return { message: "send email success" };
    }

    // 3. generate token
    const payload = { id: user.id, role: user.role };

    const token = jwt.sign(payload, process.env.JWT_SECRET_RESET!, {
      expiresIn: EXPIRED_RESET_TOKEN_JWT,
    });

    // 4. kirim email reset password + token
    await this.mailService.sendMail({
      to: body.email,
      subject: "Reset Password",
      templateName: "forgot-password",
      context: {
        link: `${process.env.BASE_URL_FE}/reset-password/${token}`,
      },
    });

    // 5. return success
    return { message: "send email success" };
  };
}
