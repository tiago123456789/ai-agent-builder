import { z } from "zod";
import { WEBHOOK_NATIVE_INTEGRATIONS } from "../../types";

export const webhookConfigSchema = z.record(z.string().min(1));

export const createWebhookSchema = z.object({
  name: z.string().min(1, "name is required").max(120),
  agentId: z.string().uuid("agentId must be a valid uuid"),
  typeAgent: z.enum(["multi_agent", "ai_agent"]),
  integrationName: z.enum(WEBHOOK_NATIVE_INTEGRATIONS as unknown as [string, ...string[]]),
  config: webhookConfigSchema.refine(
    (config) => config.text !== undefined && config.sessionId !== undefined,
    { message: "config must include text and sessionId keys" },
  ),
});
