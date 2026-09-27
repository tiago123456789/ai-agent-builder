import get from "lodash/get";
import { randomUUID } from "node:crypto";
import { webhooksRepository } from "../repository/webhooks";
import { agentsRepository } from "../repository/agents";
import { aiAgentService } from "./ai-agent.service";
import MultiAgentService from "./multi-agent.service";
import type { AgentResponse, Webhook } from "../types";
import { WEBHOOK_NATIVE_INTEGRATIONS } from "../types";
import TelegramWebhookIntegrationAdapter from "../adapters/telegram-webhook-integration.adapter";

export interface WebhookTriggerResult {
  webhook: Webhook;
  sessionId: string;
  text: string;
  response: AgentResponse;
  telegramSent: boolean;
  telegramError?: string;
}

export function resolveConfigValue(body: unknown, raw: string | undefined): string | undefined {
  if (raw === undefined || raw === "") {
    return undefined;
  }
  const resolved = get(body as object, raw);
  if (resolved !== undefined && resolved !== null) {
    return String(resolved);
  }
  // Path miss: only fall back to the raw string when it does not look like
  // a lodash path (no dots/brackets). This lets telegramChatId/telegramBotToken
  // be literals ("-100123", "123:ABC") while "message.text" correctly fails.
  if (raw.includes(".") || raw.includes("[")) {
    return undefined;
  }
  return raw;
}

class WebhookService {
  private multiAgentService = new MultiAgentService();
  private nativeIntegrations: { [key: string]: IWebhookIntegrationAdapter } = {};

  constructor() {
    this.nativeIntegrations = {
      "telegram": new TelegramWebhookIntegrationAdapter()
    }
  }

  async execute(slug: string, body: unknown): Promise<WebhookTriggerResult> {
    const webhook = await webhooksRepository.getWebhookBySlug(slug);
    if (!webhook) {
      throw new Error("Webhook not found.");
    }

    const text = resolveConfigValue(body, webhook.config.text);
    if (!text) {
      throw new Error("Could not extract text from request body using webhook config.");
    }

    const sessionId = resolveConfigValue(body, webhook.config.sessionId) ?? randomUUID();
    const integrationName = webhook.integrationName ?? "telegram";
    if (!(WEBHOOK_NATIVE_INTEGRATIONS as readonly string[]).includes(integrationName)) {
      throw new Error("Unsupported webhook integration.");
    }
    const webhookIntegration = this.nativeIntegrations[integrationName];
    const { response, telegramSent, telegramError } = await webhookIntegration.processRequest(
      text,
      sessionId,
      webhook.config,
      body,
      async () => {
        if (webhook.typeAgent === "multi_agent") {
          return this.multiAgentService.execute({
            multiAgentId: webhook.agentId,
            message: text,
            history: [],
            sessionId,
          });
        } else {
          const agent = await agentsRepository.getAgentById(webhook.agentId);
          if (!agent) {
            throw new Error("Agent not found.");
          }
          return aiAgentService.execute({
            agentSlug: agent.slug,
            input: text,
            history: [],
            sessionId,
          });
        }
      }
    );
    return { webhook, sessionId, text, response, telegramSent, telegramError };
  }
}

export default WebhookService;

export const webhookService = new WebhookService();
