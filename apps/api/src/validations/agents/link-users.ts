import { z } from "zod";

export const linkUsersSchema = z.object({
  userIds: z.array(z.string().uuid()),
});
