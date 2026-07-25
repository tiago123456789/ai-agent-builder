import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { groupToolsAllowedRepository } from "../repository/group-tools-allowed";
import { groupToolsRepository } from "../repository/group-tools";
import {
  createGroupToolsAllowedSchema,
  updateGroupToolsAllowedSchema,
  linkGroupToolsSchema,
} from "../validations/group-tools-allowed";

export class GroupToolsAllowedController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/group-tools-allowed" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/group-tools-allowed" },
  })
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const groups = await groupToolsAllowedRepository.list();
      response.json({ groups });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/group-tools-allowed/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/group-tools-allowed/:id" },
  })
  async getById(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const group = await groupToolsAllowedRepository.getById(id);
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
    labels: { method: "POST", route: "/group-tools-allowed" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "POST", route: "/group-tools-allowed" },
  })
  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createGroupToolsAllowedSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const group = await groupToolsAllowedRepository.create(parsed.data);
      response.status(201).json({ group });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "PUT", route: "/group-tools-allowed/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "PUT", route: "/group-tools-allowed/:id" },
  })
  async update(request: Request, response: Response, next: NextFunction) {
    const parsed = updateGroupToolsAllowedSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const { id } = request.params as { id: string };
      const group = await groupToolsAllowedRepository.update(id, parsed.data);
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
    labels: { method: "DELETE", route: "/group-tools-allowed/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "DELETE", route: "/group-tools-allowed/:id" },
  })
  async remove(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const deleted = await groupToolsAllowedRepository.delete(id);
      if (!deleted) {
        return response.status(404).json({ message: "Group not found" });
      }
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/group-tools-allowed/:id/tools" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/group-tools-allowed/:id/tools" },
  })
  async listTools(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const group = await groupToolsAllowedRepository.getById(id);
      if (!group) {
        return response.status(404).json({ message: "Group not found" });
      }
      const tools = await groupToolsRepository.listByGroupId(id);
      response.json({ tools });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "POST", route: "/group-tools-allowed/:id/tools" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "POST", route: "/group-tools-allowed/:id/tools" },
  })
  async linkTools(request: Request, response: Response, next: NextFunction) {
    const parsed = linkGroupToolsSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const { id } = request.params as { id: string };
      const group = await groupToolsAllowedRepository.getById(id);
      if (!group) {
        return response.status(404).json({ message: "Group not found" });
      }
      await groupToolsRepository.linkTools(id, parsed.data.entries);
      response.status(201).json({ message: "Tools linked successfully" });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "DELETE", route: "/group-tools-allowed/:id/tools/:toolId" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "DELETE", route: "/group-tools-allowed/:id/tools/:toolId" },
  })
  async unlinkTool(request: Request, response: Response, next: NextFunction) {
    try {
      const { id, toolId } = request.params as { id: string; toolId: string };
      const type = request.query.type as string;
      if (!type || !["TOOL", "MCP"].includes(type)) {
        return response.status(400).json({ message: "type query param is required (TOOL or MCP)" });
      }
      const group = await groupToolsAllowedRepository.getById(id);
      if (!group) {
        return response.status(404).json({ message: "Group not found" });
      }
      const unlinked = await groupToolsRepository.unlinkTool(id, toolId, type);
      if (!unlinked) {
        return response.status(404).json({ message: "Link not found" });
      }
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const groupToolsAllowedController = new GroupToolsAllowedController();
