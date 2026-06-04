import type { NextFunction, Request, Response } from "express";
import { usersRepository } from "../repository/users";
import { createUserSchema, updateUserSchema } from "../validations/users";

export class UsersController {
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const users = await usersRepository.listUsers();
      response.json({ users });
    } catch (error) {
      next(error);
    }
  }

  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const user = await usersRepository.createUser(parsed.data);
      response.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  }

  async update(request: Request, response: Response, next: NextFunction) {
    const parsed = updateUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const { id } = request.params as { id: string };
      const user = await usersRepository.updateUser(id, parsed.data);
      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }
      response.json({ user });
    } catch (error) {
      next(error);
    }
  }

  async remove(request: Request, response: Response, next: NextFunction) {
    try {
      const { id } = request.params as { id: string };
      const deleted = await usersRepository.deleteUser(id);
      if (!deleted) {
        return response.status(404).json({ message: "User not found" });
      }
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
