import type { NextFunction, Request, Response } from "express";

export class HealthController {
  async getHealth(_request: Request, response: Response, _next: NextFunction) {
    response.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
}

export const healthController = new HealthController();
