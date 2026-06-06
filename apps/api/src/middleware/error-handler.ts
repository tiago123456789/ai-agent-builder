import type { NextFunction, Request, Response } from "express";
import { track } from "../lib/metrics";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export async function errorHandler(
  err: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : "Internal server error";

  console.error(`[${statusCode}]`, err.message);
  await track({
    name: "api_error",
    help: "The total api errors",
    type: "counter",
    labels: {
      statusCode,
      errorName: err.name,
    }
  }, () => {})
  response.status(statusCode).json({ message });
}
