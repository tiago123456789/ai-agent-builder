import { z } from "zod";

export const linkGroupToolsSchema = z.object({
  entries: z.array(
    z.object({
      toolId: z.string().uuid("toolId must be a valid UUID"),
      type: z.enum(["TOOL", "MCP"]),
    }),
  ).min(1, "at least one entry is required"),
});
