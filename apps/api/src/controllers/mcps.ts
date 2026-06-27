import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { mcpsRepository } from "../repository/mcps";
import Encrypter from "../lib/encrypter";
import { createMcpSchema } from "../validations/mcps/create-mcp";

export class McpsController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/mcps",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/mcps",
    },
  })
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const mcps = await mcpsRepository.listMcps();
      response.json({ mcps });
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
      route: "/mcps",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/mcps",
    },
  })
  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createMcpSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const data = parsed.data;
      if (data.type === "remote" && data.headers) {
        data.headers = new Encrypter().encrypt(
          JSON.stringify(data.headers),
        ) as unknown as Record<string, string> | undefined;
      }
      const mcp = await mcpsRepository.createMcp(data);
      response.status(201).json({ mcp });
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
      route: "/mcps/:id",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/mcps/:id",
    },
  })
  async remove(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const deleted = await mcpsRepository.deleteMcp(id);
      if (!deleted) {
        return response.status(404).json({ message: "MCP not found" });
      }
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const mcpsController = new McpsController();
