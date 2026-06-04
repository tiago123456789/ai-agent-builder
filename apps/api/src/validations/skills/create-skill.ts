import { z } from "zod";

export const createSkillSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().optional(),
  content: z.string().min(1, "content is required"),
});
