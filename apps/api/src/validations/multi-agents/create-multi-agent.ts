import { z } from "zod";

export const createMultiAgentSchema = z.object({
  name: z.string().min(1, "name is required"),
  shortDescription: z.string().optional(),
  nodes: z.array(z.object({
    id: z.string(),
    triggerWhen: z.string(),
  })).optional(),
});
