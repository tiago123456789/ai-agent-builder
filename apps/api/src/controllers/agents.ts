import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { agentsRepository } from "../repository/agents";
import { agentToolsRepository } from "../repository/agents-tools";
import { agentMcpRepository } from "../repository/agents-mcp";
import { agentSkillsRepository } from "../repository/agents-skills";
import { agentUsersRepository } from "../repository/agents-users";
import { aiAgentService } from "../services/ai-agent.service";
import {
  chatRequestSchema,
  createAgentSchema,
  updateAgentSchema,
  linkToolsSchema,
  linkMcpsSchema,
  linkUsersSchema,
  linkSkillsSchema,
} from "../validations/agents";

export class AgentsController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "POST",
      route: "/agents",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/agents",
    },
  })
  async chat(request: Request, response: Response, next: NextFunction) {
    const parsed = chatRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const agentResponse = await aiAgentService.execute({
        agentSlug: parsed.data.agentSlug,
        input: parsed.data.message,
        history: parsed.data.history,
        sessionId: request.user!.id,
      });
      return response.json(agentResponse);
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/agents",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/agents",
    },
  })
  async list(request: Request, response: Response, next: NextFunction) {
    try {
      const user = request.user!;
      let agents;
      if (user.rule === "admin") {
        agents = await agentsRepository.listAgents();
      } else {
        agents = await agentUsersRepository.listAgentsByUserId(user.id);
      }
      response.json({ agents });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/agents/allowed",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/agents/allowed",
    },
  })
  async listAllowed(request: Request, response: Response, next: NextFunction) {
    try {
      const agents = await agentUsersRepository.listAgentsByUserId(request.user!.id);
      response.json({ agents });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/agents/:slug",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/agents/:slug",
    },
  })
  async getBySlug(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      response.json({ agent });
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
      route: "/agents/create",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/agents/create",
    },
  })
  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createAgentSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const agent = await agentsRepository.createAgent(parsed.data);
      response.status(201).json({ agent });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "PUT",
      route: "/agents/:slug",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "PUT",
      route: "/agents/:slug",
    },
  })
  async update(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    const parsed = updateAgentSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const agent = await agentsRepository.updateAgent(slug, parsed.data);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      response.json({ agent });
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
      route: "/agents/:slug",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/agents/:slug",
    },
  })
  async remove(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    try {
      const deleted = await agentsRepository.deleteAgent(slug);
      if (!deleted) {
        return response.status(404).json({ message: "Agent not found" });
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
    labels: {
      method: "GET",
      route: "/agents/:slug/tools",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/agents/:slug/tools",
    },
  })
  async listTools(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      const tools = await agentToolsRepository.listAgentTools(agent.id);
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
      route: "/agents/:slug/tools",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/agents/:slug/tools",
    },
  })
  async linkTools(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    const parsed = linkToolsSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      await agentToolsRepository.linkTools(agent.id, parsed.data.toolIds);
      response.status(201).json({ message: "Tools linked successfully" });
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
      route: "/agents/:slug/tools/:toolId",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/agents/:slug/tools/:toolId",
    },
  })
  async unlinkTool(request: Request, response: Response, next: NextFunction) {
    const { slug, toolId } = request.params as { slug: string; toolId: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      const unlinked = await agentToolsRepository.unlinkTool(agent.id, toolId);
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
    labels: {
      method: "GET",
      route: "/agents/:slug/mcps",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/agents/:slug/mcps",
    },
  })
  async listMcps(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      const mcps = await agentMcpRepository.listAgentMcps(agent.id);
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
      route: "/agents/:slug/mcps",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/agents/:slug/mcps",
    },
  })
  async linkMcps(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    const parsed = linkMcpsSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      await agentMcpRepository.linkAgentMcps(agent.id, parsed.data.mcpIds);
      response.status(201).json({ message: "MCPs linked successfully" });
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
      route: "/agents/:slug/mcps/:mcpId",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/agents/:slug/mcps/:mcpId",
    },
  })
  async unlinkMcp(request: Request, response: Response, next: NextFunction) {
    const { slug, mcpId } = request.params as { slug: string; mcpId: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      const unlinked = await agentMcpRepository.unlinkAgentMcp(agent.id, mcpId);
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
    labels: {
      method: "GET",
      route: "/agents/:slug/users",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/agents/:slug/users",
    },
  })
  async listUsers(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      const users = await agentUsersRepository.listUsersByAgentId(agent.id);
      response.json({ users });
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
      route: "/agents/:slug/users",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/agents/:slug/users",
    },
  })
  async linkUsers(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    const parsed = linkUsersSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      await agentUsersRepository.linkUsersToAgent(agent.id, parsed.data.userIds);
      response.status(201).json({ message: "Users linked successfully" });
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
      route: "/agents/:slug/users/:userId",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/agents/:slug/users/:userId",
    },
  })
  async unlinkUser(request: Request, response: Response, next: NextFunction) {
    const { slug, userId } = request.params as { slug: string; userId: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      await agentUsersRepository.unlinkUserFromAgent(agent.id, userId);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/agents/:slug/skills",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/agents/:slug/skills",
    },
  })
  async listSkills(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      const skills = await agentSkillsRepository.listAgentSkills(agent.id);
      response.json({ skills });
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
      route: "/agents/:slug/skills",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/agents/:slug/skills",
    },
  })
  async linkSkills(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    const parsed = linkSkillsSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      await agentSkillsRepository.linkSkills(agent.id, parsed.data.skillIds);
      response.status(201).json({ message: "Skills linked successfully" });
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
      route: "/agents/:slug/skills/:skillId",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/agents/:slug/skills/:skillId",
    },
  })
  async unlinkSkill(request: Request, response: Response, next: NextFunction) {
    const { slug, skillId } = request.params as { slug: string; skillId: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      const unlinked = await agentSkillsRepository.unlinkSkill(agent.id, skillId);
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
    labels: {
      method: "POST",
      route: "/agents/:slug/api-key",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/agents/:slug/api-key",
    },
  })
  async generateApiKey(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      const apiKey = await agentsRepository.generateApiKey(agent.id);
      response.json({ apiKey });
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
      route: "/agents/:slug/api-key",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/agents/:slug/api-key",
    },
  })
  async revokeApiKey(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    try {
      const agent = await agentsRepository.getAgentBySlug(slug);
      if (!agent) {
        return response.status(404).json({ message: "Agent not found" });
      }
      await agentsRepository.revokeApiKey(agent.id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const agentsController = new AgentsController();
