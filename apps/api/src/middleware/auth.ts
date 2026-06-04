import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        rule: "admin" | "employee";
      };
    }
  }
}



export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    request.user = verifyToken(token);
    return next();
  } catch {
    return response.status(401).json({ message: "Unauthorized" });
  }
}

export function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (request.user?.rule !== "admin") {
    return response.status(403).json({ message: "Forbidden: admin only" });
  }
  return next();
}
