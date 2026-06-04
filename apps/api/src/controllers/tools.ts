import type { NextFunction, Request, Response } from "express";
import { toolsRepository } from "../repository/tools";
import { createToolSchema } from "../validations/tools/create-tool";

export class ToolsController {
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const tools = await toolsRepository.listTools();
      response.json({ tools });
    } catch (error) {
      next(error);
    }
  }

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
