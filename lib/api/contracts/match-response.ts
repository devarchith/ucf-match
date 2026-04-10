import { z } from "zod";

/** POST /api/matches/{id}/response success body per docs/api-contracts.md. */
export const weeklyMatchUpdatedWireSchema = z.object({
  id: z.string(),
  weekId: z.string(),
  status: z.enum(["PENDING", "ACTIVE", "CLOSED"]),
  userAResponse: z.enum(["PENDING", "ACCEPTED", "DECLINED"]),
  userBResponse: z.enum(["PENDING", "ACCEPTED", "DECLINED"]),
  updatedAt: z.string()
});

export type WeeklyMatchUpdatedWire = z.infer<typeof weeklyMatchUpdatedWireSchema>;
