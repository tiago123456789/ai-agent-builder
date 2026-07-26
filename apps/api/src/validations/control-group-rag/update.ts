import { z } from "zod";

export const updateControlGroupRagSchema = z.object({
  title: z.string().min(1).max(100).optional(),
});
