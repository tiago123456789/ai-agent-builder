import { z } from "zod";

export const linkToolsSchema = z.object({
  toolIds: z.array(z.string().uuid()).min(1, "at least one toolId is required"),
});
