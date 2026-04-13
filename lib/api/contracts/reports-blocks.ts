import { z } from "zod";

/** POST /api/reports 201 body per docs/api-contracts.md. */
export const reportCreatedWireSchema = z.object({
  id: z.string(),
  reporterUserId: z.string(),
  reportedUserId: z.string(),
  matchId: z.string(),
  weekId: z.string(),
  reason: z.enum(["HARASSMENT", "SPAM", "SAFETY_CONCERN", "OTHER"]),
  details: z.string().nullable(),
  createdAt: z.string()
});

export type ReportCreatedWire = z.infer<typeof reportCreatedWireSchema>;

/** POST /api/blocks 201 body per docs/api-contracts.md. */
export const blockCreatedWireSchema = z.object({
  id: z.string(),
  blockerUserId: z.string(),
  blockedUserId: z.string(),
  reason: z.string().nullable(),
  createdAt: z.string()
});

export type BlockCreatedWire = z.infer<typeof blockCreatedWireSchema>;
