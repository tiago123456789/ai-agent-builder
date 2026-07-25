import { z } from "zod";

export const createGroupToolsAllowedSchema = z.object({
  title: z.string().min(1, "title is required").max(100),
  description: z.string().min(1, "description is required").max(255),
});
