import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { skillsRepository } from "../repository/skills";
import { createSkillSchema, updateSkillSchema } from "../validations/skills";

export class SkillsController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/skills",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/skills",
    },
  })
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const skills = await skillsRepository.listSkills();
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
      method: "GET",
      route: "/skills/:id",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/skills/:id",
    },
  })
  async getById(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const skill = await skillsRepository.getSkillById(id);
      if (!skill) {
        return response.status(404).json({ message: "Skill not found" });
      }
      response.json({ skill });
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
      route: "/skills",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/skills",
    },
  })
  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createSkillSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const skill = await skillsRepository.createSkill(parsed.data);
      response.status(201).json({ skill });
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
      route: "/skills/:id",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "PUT",
      route: "/skills/:id",
    },
  })
  async update(request: Request, response: Response, next: NextFunction) {
    const parsed = updateSkillSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const { id } = request.params as { id: string };
      const skill = await skillsRepository.updateSkill(id, parsed.data);
      if (!skill) {
        return response.status(404).json({ message: "Skill not found" });
      }
      response.json({ skill });
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
      route: "/skills/:id",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/skills/:id",
    },
  })
  async remove(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const deleted = await skillsRepository.deleteSkill(id);
      if (!deleted) {
        return response.status(404).json({ message: "Skill not found" });
      }
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const skillsController = new SkillsController();
