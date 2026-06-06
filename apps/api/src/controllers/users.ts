import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { usersRepository } from "../repository/users";
import { createUserSchema, updateUserSchema } from "../validations/users";

export class UsersController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "GET",
      route: "/users",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "GET",
      route: "/users",
    },
  })
  async list(_request: Request, response: Response, next: NextFunction) {
    try {
      const users = await usersRepository.listUsers();
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
      route: "/users",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "POST",
      route: "/users",
    },
  })
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

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "PUT",
      route: "/users/:id",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "PUT",
      route: "/users/:id",
    },
  })
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

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: {
      method: "DELETE",
      route: "/users/:id",
    },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: {
      method: "DELETE",
      route: "/users/:id",
    },
  })
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
