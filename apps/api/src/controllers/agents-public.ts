import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { agentsRepository } from "../repository/agents";
import { aiAgentService } from "../services/ai-agent.service";
import { publicChatSchema } from "../validations/agents-public/public-chat";

export class AgentsPublicController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "POST",
      route: "/agents/public/chat",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/agents/public/chat",
    },
  })
  async chat(request: Request, response: Response, next: NextFunction) {
    const parsed = publicChatSchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const { apiKey, message, history } = parsed.data;

      const agent = await agentsRepository.getAgentByApiKey(apiKey);
      if (!agent) {
        return response.status(401).json({ message: "Invalid API key" });
      }

      const agentResponse = await aiAgentService.execute({
        agentSlug: agent.slug,
        input: message,
        history,
      });

      response.json(agentResponse);
    } catch (error) {
      next(error);
    }
  }
}

export const agentsPublicController = new AgentsPublicController();
