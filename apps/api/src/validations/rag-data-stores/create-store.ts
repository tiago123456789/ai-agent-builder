import { z } from "zod";

export const createRagDataStoreSchema = z.object({
  description: z.string().min(1, "description is required"),
  connection: z.string().min(1, "connection is required"),
});
