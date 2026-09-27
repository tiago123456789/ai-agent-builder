import type { NextFunction, Request, Response } from "express";
import { Metric, MetricHistogram } from "../lib/metrics";
import { webhooksRepository } from "../repository/webhooks";
import { webhookService } from "../services/webhook.service";
import { createWebhookSchema, updateWebhookSchema } from "../validations/webhooks";
import { WEBHOOK_NATIVE_INTEGRATIONS } from "../types";

export class WebhooksController {
  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/webhooks" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/webhooks" },
  })
  async list(request: Request, response: Response, next: NextFunction) {
    try {
      const webhooks = await webhooksRepository.listWebhooks();
      response.json({ webhooks });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/webhooks/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/webhooks/:id" },
  })
  async getById(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params as { id: string };
    try {
      const webhook = await webhooksRepository.getWebhookById(id);
      if (!webhook) {
        return response.status(404).json({ message: "Webhook not found" });
      }
      response.json({ webhook });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "GET", route: "/webhooks/integrations" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "GET", route: "/webhooks/integrations" },
  })
  async listIntegrations(request: Request, response: Response, next: NextFunction) {
    try {
      response.json({ integrations: WEBHOOK_NATIVE_INTEGRATIONS });
    } catch (error) {
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "POST", route: "/webhooks/create" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "POST", route: "/webhooks/create" },
  })
  async create(request: Request, response: Response, next: NextFunction) {
    const parsed = createWebhookSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const webhook = await webhooksRepository.createWebhook(parsed.data);
      response.status(201).json({ webhook });
    } catch (error: any) {
      if (error.message === "Agent not found." || error.message === "Multi agent not found.") {
        return response.status(400).json({ message: error.message });
      }
      if (error.code === "23505") {
        return response.status(409).json({ message: "Webhook slug already exists" });
      }
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "PUT", route: "/webhooks/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "PUT", route: "/webhooks/:id" },
  })
  async update(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params as { id: string };
    const parsed = updateWebhookSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      const webhook = await webhooksRepository.updateWebhook(id, parsed.data);
      if (!webhook) {
        return response.status(404).json({ message: "Webhook not found" });
      }
      response.json({ webhook });
    } catch (error: any) {
      if (error.message === "Agent not found." || error.message === "Multi agent not found.") {
        return response.status(400).json({ message: error.message });
      }
      if (error.code === "23505") {
        return response.status(409).json({ message: "Webhook slug already exists" });
      }
      next(error);
    }
  }

  @Metric({
    name: "total_requests",
    help: "Total of requests",
    type: "counter",
    labels: { method: "DELETE", route: "/webhooks/:id" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "DELETE", route: "/webhooks/:id" },
  })
  async remove(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params as { id: string };
    try {
      const deleted = await webhooksRepository.deleteWebhook(id);
      if (!deleted) {
        return response.status(404).json({ message: "Webhook not found" });
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
    labels: { method: "POST", route: "/webhook/:slug" },
  })
  @MetricHistogram({
    name: "http_requests_duration",
    help: "Duration of http requests",
    labels: { method: "POST", route: "/webhook/:slug" },
  })
  async trigger(request: Request, response: Response, next: NextFunction) {
    const { slug } = request.params as { slug: string };
    try {
      const result = await webhookService.execute(slug, request.body);
      response.json(result);
    } catch (error: any) {
      if (error.message === "Webhook not found.") {
        return response.status(404).json({ message: error.message });
      }
      if (
        error.message === "Agent not found." ||
        error.message === "Multi agent not found." ||
        error.message === "Unsupported webhook integration." ||
        error.message.startsWith("Could not extract text")
      ) {
        return response.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
}

export const webhooksController = new WebhooksController();
