import { ReportReason } from "@prisma/client";
import { z } from "zod";

export const reportInputSchema = z.object({
  reportedUserId: z.string().trim().min(1),
  /** Accepted for client convenience; the server sets `weekId` from the resolved match. */
  weekId: z.string().trim().min(1).optional(),
  matchId: z.string().trim().min(1).optional(),
  reason: z.nativeEnum(ReportReason),
  details: z.string().trim().max(1000).optional()
});

export type ReportInput = z.infer<typeof reportInputSchema>;
