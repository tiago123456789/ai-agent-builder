import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().min(1, "message is required"),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1, "history content is required"),
    }),
  ),
  agentSlug: z.string(),
});
