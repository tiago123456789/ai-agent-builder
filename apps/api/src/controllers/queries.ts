import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { listQueries } from "../lib/query-store";

export class QueriesController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/queries",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/queries",
    },
  })
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
