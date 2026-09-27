import { z } from "zod";
import { WEBHOOK_NATIVE_INTEGRATIONS } from "../../types";
import { webhookConfigSchema } from "./create-webhook";

export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  agentId: z.string().uuid("agentId must be a valid uuid").optional(),
  typeAgent: z.enum(["multi_agent", "ai_agent"]).optional(),
  integrationName: z.enum(WEBHOOK_NATIVE_INTEGRATIONS as unknown as [string, ...string[]]).optional(),
  config: webhookConfigSchema.optional(),
});
