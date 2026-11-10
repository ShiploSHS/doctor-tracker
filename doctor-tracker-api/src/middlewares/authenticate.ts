import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

interface JwtPayload {
  sub: string;
  role: "admin";
  email: string;
  name: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired session");
  }
}
