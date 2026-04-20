import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../../../src/generated/prisma/index.js";
import { ApiError } from "../utils/api-error.js"; 

export class AuthMiddleware {
  verifyToken = (secretKey: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = req.cookies?.accessToken;
      //   const token = req.headers.authorization?.split(" ")[1];

      if (!token) throw new ApiError("No token provided", 401);

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
