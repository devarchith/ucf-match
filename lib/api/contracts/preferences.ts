import { z } from "zod";

/** PUT /api/preferences success body per docs/api-contracts.md. */
export const preferencesWireSchema = z.object({
  id: z.string(),
  userId: z.string(),
  preferredGenders: z.array(z.string()),
  interests: z.array(z.string()),
  communicationStyle: z.string().nullable(),
  updatedAt: z.string()
});

export type PreferencesWire = z.infer<typeof preferencesWireSchema>;
