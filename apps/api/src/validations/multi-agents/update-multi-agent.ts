import { z } from "zod";

export const updateMultiAgentSchema = z.object({
  name: z.string().min(1).optional(),
  shortDescription: z.string().nullable().optional(),
  nodes: z.array(z.object({
    id: z.string(),
    triggerWhen: z.string(),
  })).nullable().optional(),
});
