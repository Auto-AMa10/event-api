import { Request, Response } from "express";
import { cookieOptions } from "../../config/cookie.js";
import { AuthService } from "./auth.service.js";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);
      res.status(200).send(result);
    } catch (error) {
      console.error("Registration error:", error);
      throw error; // Let the global error handler catch it
    }
  };

  login = async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await this.authService.login(
      req.body,
    );

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(200).send({ data: { token: accessToken, user } });
  };

  logout = async (req: Request, res: Response) => {
    const result = await this.authService.logout(req.cookies.refreshToken);

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).send(result);
  };

  refresh = async (req: Request, res: Response) => {
    const result = await this.authService.refresh(req.cookies.refreshToken);

    res.cookie("accessToken", result.accessToken, cookieOptions);

    res.status(200).send({ message: "Refresh success" });
  };

  forgotPassword = async (req: Request, res: Response) => {
    const result = await this.authService.forgotPassword(req.body);
    res.status(200).send(result);
  };

  resetPassword = async (req: Request, res: Response) => {
    const userId = res.locals.user.id;
    const result = await this.authService.resetPassword(req.body, userId);
    res.status(200).send(result);
  };

  // google = async (req: Request, res: Response) => {
  //   const { user, accessToken, refreshToken } = await this.authService.google(
  //     req.body,
  //   );

  //   res.cookie("accessToken", accessToken, cookieOptions);
  //   res.cookie("refreshToken", refreshToken, cookieOptions);

  //   res.status(200).send({ user });
  // };
}