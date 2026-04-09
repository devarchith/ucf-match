import { z } from "zod";

export const preferencesInputSchema = z.object({
  preferredGenders: z.array(z.string().trim().min(1).max(40)).min(1).max(10),
  interests: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  communicationStyle: z.string().trim().min(1).max(120).optional()
});

export type PreferencesInput = z.infer<typeof preferencesInputSchema>;
