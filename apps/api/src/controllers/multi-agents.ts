import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { multiAgentsRepository } from "../repository/multi-agents";
import MultiAgentService from "../services/multi-agent.service";
import {
  createMultiAgentSchema,
  updateMultiAgentSchema,
  chatMultiAgentSchema,
  linkAgentsSchema,
} from "../validations/multi-agents";

const multiAgentService = new MultiAgentService();

export class MultiAgentsController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/multi-agents" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/multi-agents" },
  })
  async list(request: Request, response: Response, next: NextFunction) {
    try {
      const multiAgents = await multiAgentsRepository.listMultiAgents();
      response.json({ multiAgents });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/multi-agents/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/multi-agents/:id" },
  })
  async getById(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params as { id: string };
    try {
      const multiAgent = await multiAgentsRepository.getMultiAgentById(id);
      if (!multiAgent) {
        return response.status(404).json({ message: "Multi agent not found" });
      }
      const agents = await multiAgentsRepository.listLinkedAgents(id);
      response.json({ multiAgent, agents });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "POST", route: "/multi-agents/create" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "POST", route: "/multi-agents/create" },
  })
  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createMultiAgentSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const multiAgent = await multiAgentsRepository.createMultiAgent(parsed.data);
      response.status(201).json({ multiAgent });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "PUT", route: "/multi-agents/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "PUT", route: "/multi-agents/:id" },
  })
  async update(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params as { id: string };
    const parsed = updateMultiAgentSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const multiAgent = await multiAgentsRepository.updateMultiAgent(id, parsed.data);
      if (!multiAgent) {
        return response.status(404).json({ message: "Multi agent not found" });
      }
      response.json({ multiAgent });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "DELETE", route: "/multi-agents/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "DELETE", route: "/multi-agents/:id" },
  })
  async remove(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params as { id: string };
    try {
      const deleted = await multiAgentsRepository.deleteMultiAgent(id);
      if (!deleted) {
        return response.status(404).json({ message: "Multi agent not found" });
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
    labels: { method: "GET", route: "/multi-agents/:id/agents" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/multi-agents/:id/agents" },
  })
  async listAgents(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params as { id: string };
    try {
      const multiAgent = await multiAgentsRepository.getMultiAgentById(id);
      if (!multiAgent) {
        return response.status(404).json({ message: "Multi agent not found" });
      }
      const agents = await multiAgentsRepository.listLinkedAgents(id);
      response.json({ agents });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "POST", route: "/multi-agents/:id/agents" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "POST", route: "/multi-agents/:id/agents" },
  })
  async linkAgents(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params as { id: string };
    const parsed = linkAgentsSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const multiAgent = await multiAgentsRepository.getMultiAgentById(id);
      if (!multiAgent) {
        return response.status(404).json({ message: "Multi agent not found" });
      }
      await multiAgentsRepository.linkAgents(id, parsed.data.agentIds);
      response.status(201).json({ message: "Agents linked successfully" });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "DELETE", route: "/multi-agents/:id/agents/:agentId" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "DELETE", route: "/multi-agents/:id/agents/:agentId" },
  })
  async unlinkAgent(request: Request, response: Response, next: NextFunction) {
    const { id, agentId } = request.params as { id: string; agentId: string };
    try {
      const multiAgent = await multiAgentsRepository.getMultiAgentById(id);
      if (!multiAgent) {
        return response.status(404).json({ message: "Multi agent not found" });
      }
      const unlinked = await multiAgentsRepository.unlinkAgent(id, agentId);
      if (!unlinked) {
        return response.status(404).json({ message: "Link not found" });
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
    labels: { method: "POST", route: "/multi-agents/:id/chat" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "POST", route: "/multi-agents/:id/chat" },
  })
  async chat(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params as { id: string };
    const parsed = chatMultiAgentSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const result = await multiAgentService.execute({
        multiAgentId: id,
        message: parsed.data.message,
        history: parsed.data.history ?? [],
        sessionId: request.user!.id,
      });
      response.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const multiAgentsController = new MultiAgentsController();
