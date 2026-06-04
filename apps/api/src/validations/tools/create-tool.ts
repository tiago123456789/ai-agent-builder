import { z } from "zod";

export const createToolSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
  tool: z.string().min(1, "tool is required"),
  package: z.string().optional(),
  isNative: z.boolean().optional(),
});
