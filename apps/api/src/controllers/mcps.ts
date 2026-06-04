import type { NextFunction, Request, Response } from "express";
import { mcpsRepository } from "../repository/mcps";
import Encrypter from "../lib/encrypter";
import { createMcpSchema } from "../validations/mcps/create-mcp";

export class McpsController {
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const mcps = await mcpsRepository.listMcps();
      response.json({ mcps });
    } catch (error) {
      next(error);
    }
  }

  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createMcpSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      parsed.data.headers = new Encrypter().encrypt(
        JSON.stringify(parsed.data.headers),
      ) as unknown as Record<string, string> | undefined;
      const mcp = await mcpsRepository.createMcp(parsed.data);
      response.status(201).json({ mcp });
    } catch (error) {
      next(error);
    }
  }

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
