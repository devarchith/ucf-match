import { z } from "zod";

/** GET /api/me success body (aligned with `getMeSnapshot`; dates are ISO strings on the wire). */
const meProfileWireSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    major: z.string().nullable(),
    graduationYear: z.number().nullable(),
    bio: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
  })
  .nullable();

export const meWireSchema = z.object({
  userId: z.string(),
  ucfEmail: z.string(),
  isEmailVerified: z.boolean(),
  profile: meProfileWireSchema,
  hasQuestionnaire: z.boolean(),
  hasPreferences: z.boolean()
});

export type MeWire = z.infer<typeof meWireSchema>;
