import { z } from "zod";

export const createMcpSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("remote"),
    description: z.string().optional(),
    url: z.string().url("url must be a valid URL"),
    headers: z.record(z.string()).optional(),
  }),
  z.object({
    type: z.literal("stdio"),
    description: z.string().optional(),
    command: z.string().min(1, "command is required"),
    args: z.string().optional(),
    envs: z.string().optional(),
  }),
]);
