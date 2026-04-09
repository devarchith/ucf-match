import { z } from "zod";

export const profileInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  major: z.string().trim().min(1).max(120).optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
  bio: z.string().trim().max(500).optional()
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
