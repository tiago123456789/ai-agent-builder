import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(4).optional(),
  rule: z.enum(["admin", "employee"]).optional(),
  groupToolsAllowedId: z.string().uuid().nullable().optional(),
});
