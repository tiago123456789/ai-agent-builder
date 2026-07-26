import { z } from "zod";

export const addDocumentSchema = z.object({
  text: z.string().min(1, "text is required"),
  groupRagId: z.string().uuid().nullable().optional(),
});
