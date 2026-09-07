import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { modelsRepository } from "../repository/models";

export class ModelsController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/models",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/models",
    },
  })
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const models = await modelsRepository.listModels();
      response.json(models);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      response.json([]);
    }
  }
}

export const modelsController = new ModelsController();