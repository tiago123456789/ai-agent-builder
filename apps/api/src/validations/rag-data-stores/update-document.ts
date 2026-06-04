import { z } from "zod";

export const updateDocumentSchema = z.object({
  content: z.string().min(1, "content is required"),
});
