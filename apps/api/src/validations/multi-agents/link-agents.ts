import { z } from "zod";

export const linkAgentsSchema = z.object({
  agentIds: z.array(z.string()).min(1, "agentIds is required"),
});
