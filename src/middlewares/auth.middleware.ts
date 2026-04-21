import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js";
import { Role } from "../generated/prisma/index.js";

export class AuthMiddleware {
  verifyToken = (secretKey: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      let token: string | undefined;

      // kalo authBearerToken ada, masukin authBearerTokennya ke variable token
      const authBearerToken = req.headers.authorization?.split(" ")[1];
      if (authBearerToken) {
        token = authBearerToken;
      }

      // kalo variable token ga keisi, berarti coba isi variablenya dengan token
      // yg ada di cookie
      if (!token) {
        token = req.cookies.accessToken;
      }

      // kalo variable token ga keisi juga, berarti tokennya ga ada.
      if (!token) {
        throw new ApiError("No token provided", 401);
      }

      try {
        const payload = jwt.verify(token, secretKey);
        res.locals.user = payload;
        next();
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          return next(new ApiError("Token expired", 401));
        }

        return next(new ApiError("Token invalid", 401));
      }
    };
  };

  verifyRole = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const userRole = res.locals.user.role;

      if (!userRole || !roles.includes(userRole)) {
        throw new ApiError("You dont have access.", 403);
      }

      next();
    };
  };
}
