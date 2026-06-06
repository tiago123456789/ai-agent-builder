import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { toolsRepository } from "../repository/tools";
import { createToolSchema } from "../validations/tools/create-tool";

export class ToolsController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/tools",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/tools",
    },
  })
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const tools = await toolsRepository.listTools();
      response.json({ tools });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "POST",
      route: "/tools",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/tools",
    },
  })
  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createToolSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const tool = await toolsRepository.createTool(parsed.data);
      response.status(201).json({ tool });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "DELETE",
      route: "/tools/:id",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/tools/:id",
    },
  })
  async remove(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const deleted = await toolsRepository.deleteTool(id);
      if (!deleted) {
        return response.status(404).json({ message: "Tool not found" });
      }
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const toolsController = new ToolsController();
