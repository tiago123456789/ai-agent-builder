import { z } from "zod";

export const createControlGroupRagSchema = z.object({
  title: z.string().min(1, "title is required").max(100),
});
