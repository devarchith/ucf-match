import { z } from "zod";

export const blockInputSchema = z.object({
  blockedUserId: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional()
});

export type BlockInput = z.infer<typeof blockInputSchema>;
