import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.string().email("invalid email"),
  password: z.string().min(4, "password must be at least 4 characters"),
  rule: z.enum(["admin", "employee"]),
  groupToolsAllowedId: z.string().uuid().nullable().optional(),
});
