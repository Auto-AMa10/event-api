import { Response, NextFunction } from "express";
import { UserService } from "./user.service.js";
import { AuthRequest } from "../../utils/auth-middleware.js";

export class UserController {
  constructor(private userService: UserService) {}

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.updateProfile(req.user.id, req.body);
      res.status(200).json({ message: "Profile updated successfully", data: user });
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.changePassword(req.user.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
