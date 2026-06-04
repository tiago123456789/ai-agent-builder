import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(1, "name is required"),
  systemPrompt: z.string().min(1, "systemPrompt is required"),
  hasRagEnabled: z.boolean().optional(),
  ragDataStoreId: z.string().optional(),
  guardrailEnabled: z.boolean().optional(),
  guardrailRules: z.string().optional(),
  model: z.string().max(150).optional(),
  temperature: z.number().min(0).max(1).optional(),
});
