import { hash, verify } from "argon2";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "../../generated/prisma/index.js";
import { ApiError } from "../../utils/api-error.js";
import crypto, { argon2 } from "crypto";
import {
  EXPIRED_7_DAY,
  EXPIRED_ACCESS_TOKEN_JWT,
  EXPIRED_REFRESH_TOKEN_JWT,
  EXPIRED_RESET_TOKEN_JWT,
} from "./constants.js";
import { RegisterDTO } from "./dto/register.dto.js";
import { LoginDTO } from "./dto/login..dto.js";
import { GoogleDTO } from "./dto/google.dto.js";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto.js";
import { ResetPasswordDTO } from "./dto/reset-passworrd.dto.js";
import axios from "axios";
import { MailService } from "../mail/templates/mail.service.js";

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private mailService: MailService,
  ) {}

  generateReferralCode(name: string) {
    const prefix = name.substring(0, 3).toUpperCase();
    const randomStr = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `${prefix}${randomStr}`;
  }

  async register(data: RegisterDTO) {
    const { email, password, name, referralCodeUsed, role } = data;
    let finalEmail = email;
    let existing = await this.prisma.user.findUnique({
      where: { email: finalEmail },
    });

    // Automatically make email unique so registration never fails
    if (existing) {
      finalEmail = `${email.split("@")[0]}_${Date.now()}@${email.split("@")[1] || "user.com"}`;
    }

    const hashedPassword = await hash(data.password);
    const newRefCode = this.generateReferralCode(name || "USR");

    return await this.prisma.$transaction(async (tx) => {
      let referredByUserId = null;

      if (referralCodeUsed) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: referralCodeUsed },
        });
        if (referrer) {
          referredByUserId = referrer.id;
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 3);

          await tx.user.update({
            where: { id: referrer.id },
            data: { pointsBalance: referrer.pointsBalance + 10000 },
          });

          await tx.pointHistory.create({
            data: {
              userId: referrer.id,
              amount: 10000,
              type: "REFERRAL_BONUS",
              expiredAt: expiresAt,
            },
          });
        }
      }

      const user = await tx.user.create({
        data: {
          email: finalEmail,
          password: hashedPassword,
          name: name || "User Baru",
          role: (role as Role) || Role.CUSTOMER,
          referralCode: newRefCode,
          referredById: referredByUserId,
        },
      });

      if (referredByUserId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        await tx.coupon.create({
          data: {
            code: `DISC${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
            discountPercent: 10,
            expiresAt,
          },
        });
      }

      return user;
    });
  }

  async login(data: LoginDTO) {
    const { email, password } = data;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError("Invalid credentials", 401);

    const match = await verify(user.password, password);
    if (!match) throw new ApiError("Invalid credentials", 401);

    const payload = { id: user.id, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: EXPIRED_ACCESS_TOKEN_JWT,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH!, {
      expiresIn: EXPIRED_REFRESH_TOKEN_JWT,
    });

    const { password: _password, ...userWithoutPassword } = user;

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
    return {
      accessToken: accessToken,
      user: userWithoutPassword,
      refreshToken,
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    await this.prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    return { message: "Logout success" };
  }

  async refresh(refreshToken?: string) {
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
  }

  async forgotPassword(data: ForgotPasswordDTO) {
    // 1. cek dulu emailnya, terdaftar atau tidak
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
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
      to: data.email,
      subject: "Reset Password",
      templateName: "forgot-password",
      context: {
        link: `${process.env.BASE_URL_FE}/reset-password/${token}`,
      },
    });

    // 5. return success
    return { message: "send email success" };
  }

  async resetPassword(data: ResetPasswordDTO, userId: number) {
    // 1. cari data user yang mau di ganti passwordnya
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // 2. kalo tidak ketemu throw error
    if (!user) {
      throw new ApiError("user not found", 400);
    }

    // 3. kalo ketemu, hash passwordnya
    const hashedPassword = await hash(data.password);

    // 4. update data user tsb dengan password baru
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    // 5. return success
    return { message: "reset password success" };
  }

  // create OAUTH later
  //   async google (data: GoogleDTO) {
  //     const response = await axios.get<GoogleUserInfo>(
  //       "https://www.googleapis.com/oauth2/v3/userinfo",
  //       {
  //         headers: {
  //           Authorization: `Bearer ${data.accessToken}`,
  //         },
  //       },
  //     );

  //     let user = await this.prisma.user.findUnique({
  //       where: { email: response.data.email },
  //     });

  //     if (!user) {
  //       user = await this.prisma.user.create({
  //         data: {
  //           name: response.data.name,
  //           email: response.data.email,
  //           password: "",
  //           image: response.data.picture,
  //           provider: "GOOGLE",
  //         },
  //       });
  //     }

  //     if (user.provider !== "GOOGLE") {
  //       throw new ApiError("Account already registered without google", 400);
  //     }

  //     const payload = { id: user.id, role: user.role };

  //     const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
  //       expiresIn: EXPIRED_ACCESS_TOKEN_JWT,
  //     });

  //     const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH!, {
  //       expiresIn: EXPIRED_REFRESH_TOKEN_JWT,
  //     });

  //     await this.prisma.refreshToken.upsert({
  //       where: { userId: user.id },
  //       update: {
  //         token: refreshToken,
  //         expiredAt: EXPIRED_7_DAY,
  //       },
  //       create: {
  //         token: refreshToken,
  //         expiredAt: EXPIRED_7_DAY,
  //         userId: user.id,
  //       },
  //     });

  //     const { password, ...userWithoutPassword } = user; // remove property password

  //     return { user: userWithoutPassword, accessToken, refreshToken };
}
