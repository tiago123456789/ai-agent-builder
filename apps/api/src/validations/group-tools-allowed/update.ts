import { z } from "zod";

export const updateGroupToolsAllowedSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(255).optional(),
});
