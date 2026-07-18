import type { NextFunction, Request, Response } from "express";
import { Metric } from "../lib/metrics";
import { agentsRepository } from "../repository/agents";

export class AgentsPublicInfoController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/agents/public/info",
    },
  })
  async getInfo(request: Request, response: Response, next: NextFunction) {
    const apiKey = request.query.apiKey as string | undefined;

    if (!apiKey) {
      return response.status(400).json({ message: "apiKey query parameter is required" });
    }

    try {
      const agent = await agentsRepository.getAgentByApiKey(apiKey);
      if (!agent) {
        return response.status(401).json({ message: "Invalid API key" });
      }

      response.json({ name: agent.name, slug: agent.slug });
    } catch (error) {
      next(error);
    }
  }
}

export const agentsPublicInfoController = new AgentsPublicInfoController();
