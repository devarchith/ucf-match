import { z } from "zod";

/** GET/PUT /api/profile success body per docs/api-contracts.md (ISO date strings on the wire). */
export const profileWireSchema = z.object({
  id: z.string(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  major: z.string().nullable(),
  graduationYear: z.number().nullable(),
  bio: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type ProfileWire = z.infer<typeof profileWireSchema>;
