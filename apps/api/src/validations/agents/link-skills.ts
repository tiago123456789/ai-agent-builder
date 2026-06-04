import { z } from "zod";

export const linkSkillsSchema = z.object({
  skillIds: z.array(z.string().uuid()),
});
