import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { signToken, validateCredentials } from "../lib/auth";

export class AuthController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "POST",
      route: "/auth/login",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/auth/login",
    },
  })
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
          controlGroupRagId: user.controlGroupRagId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
