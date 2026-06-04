import { z } from "zod";

export const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  systemPrompt: z.string().min(1).optional(),
  hasRagEnabled: z.boolean().optional(),
  ragDataStoreId: z.string().nullable().optional(),
  guardrailEnabled: z.boolean().optional(),
  guardrailRules: z.string().nullable().optional(),
  model: z.string().max(150).optional(),
  temperature: z.number().min(0).max(1).optional(),
});
