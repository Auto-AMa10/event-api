import bcrypt from "bcrypt";
import { PrismaClient } from "../../generated/prisma/index.js";
import { ApiError } from "../../utils/api-error.js";

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async updateProfile(userId: number, data: { name?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError("User not found", 404);

    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? data.name : user.name,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        pointsBalance: true,
        avatarUrl: true,
      }
    });
  }

  async changePassword(userId: number, data: any) {
    const { currentPassword, newPassword } = data;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError("User not found", 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new ApiError("Password lama tidak sesuai", 401);

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: "Password updated successfully" };
  }
} 
