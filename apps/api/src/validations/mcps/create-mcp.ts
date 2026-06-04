import { z } from "zod";

export const createMcpSchema = z.object({
  description: z.string().optional(),
  url: z.string().url("url must be a valid URL"),
  headers: z.record(z.string()).optional(),
});
