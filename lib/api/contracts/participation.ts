import { z } from "zod";

/** PUT /api/weeks/current/opt-in success body per docs/api-contracts.md. */
export const weeklyOptInWireSchema = z.object({
  id: z.string(),
  userId: z.string(),
  weekId: z.string(),
  status: z.enum(["OPTED_IN", "OPTED_OUT", "MATCHED"]),
  optedInAt: z.string().nullable(),
  updatedAt: z.string()
});

export type WeeklyOptInWire = z.infer<typeof weeklyOptInWireSchema>;
