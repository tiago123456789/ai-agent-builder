import type { NextFunction, Request, Response } from "express";
import { signToken, validateCredentials } from "../lib/auth";

export class AuthController {
  async login(request: Request, response: Response, next: NextFunction) {
    const { email, password } = request.body ?? {};

    if (!email || !password) {
      return response.status(400).json({ message: "Email and password are required" });
    }

    try {
      const user = await validateCredentials(email, password);

      if (!user) {
        return response.status(401).json({ message: "Invalid credentials" });
      }

      return response.json({
        token: signToken(user),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          rule: user.rule,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
