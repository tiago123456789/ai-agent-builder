import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { controlGroupRagRepository } from "../repository/control-group-rag";
import {
  createControlGroupRagSchema,
  updateControlGroupRagSchema,
} from "../validations/control-group-rag";

export class ControlGroupRagController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/control-group-rag" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/control-group-rag" },
  })
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const groups = await controlGroupRagRepository.list();
      response.json({ groups });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/control-group-rag/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/control-group-rag/:id" },
  })
  async getById(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const group = await controlGroupRagRepository.getById(id);
      if (!group) {
        return response.status(404).json({ message: "Group not found" });
      }
      response.json({ group });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "POST", route: "/control-group-rag" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "POST", route: "/control-group-rag" },
  })
  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createControlGroupRagSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const group = await controlGroupRagRepository.create(parsed.data);
      response.status(201).json({ group });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "PUT", route: "/control-group-rag/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "PUT", route: "/control-group-rag/:id" },
  })
  async update(request: Request, response: Response, next: NextFunction) {
    const parsed = updateControlGroupRagSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const { id } = request.params as { id: string };
      const group = await controlGroupRagRepository.update(id, parsed.data);
      if (!group) {
        return response.status(404).json({ message: "Group not found" });
      }
      response.json({ group });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "DELETE", route: "/control-group-rag/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "DELETE", route: "/control-group-rag/:id" },
  })
  async remove(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const deleted = await controlGroupRagRepository.delete(id);
      if (!deleted) {
        return response.status(404).json({ message: "Group not found" });
      }
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const controlGroupRagController = new ControlGroupRagController();
