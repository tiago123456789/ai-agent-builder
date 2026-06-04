import { z } from "zod";

export const linkMcpsSchema = z.object({
  mcpIds: z.array(z.string().uuid()),
});
