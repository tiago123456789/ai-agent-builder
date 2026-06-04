import type { NextFunction, Request, Response } from "express";
import { skillsRepository } from "../repository/skills";
import { createSkillSchema, updateSkillSchema } from "../validations/skills";

export class SkillsController {
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const skills = await skillsRepository.listSkills();
      response.json({ skills });
    } catch (error) {
      next(error);
    }
  }

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
