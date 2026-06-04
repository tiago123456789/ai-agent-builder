import type { NextFunction, Request, Response } from "express";
import { listQueries } from "../lib/query-store";

export class QueriesController {
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const queries = await listQueries();
      response.json({ queries });
    } catch (error) {
      next(error);
    }
  }
}

export const queriesController = new QueriesController();
