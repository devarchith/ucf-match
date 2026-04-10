import { z } from "zod";

/**
 * Wire shape for GET /api/weeks/current per docs/api-contracts.md.
 * `activeMatch` is returned by the route for match reveal; treat as nullable object (not in the short doc table).
 */
export const currentWeekWireSchema = z.object({
  week: z
    .object({
      id: z.string(),
      label: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      status: z.enum(["ACTIVE", "DRAFT", "CLOSED"])
    })
    .nullable(),
  participation: z
    .object({
      id: z.string().nullable(),
      status: z.enum(["OPTED_IN", "OPTED_OUT", "MATCHED"]),
      optedInAt: z.string().nullable(),
      updatedAt: z.string().nullable()
    })
    .nullable(),
  canOptIn: z.boolean(),
  reason: z.string().nullable(),
  activeMatch: z
    .object({
      matchId: z.string(),
      otherUserId: z.string(),
      firstName: z.string(),
      major: z.string().nullable(),
      bio: z.string().nullable(),
      graduationYear: z.number().nullable(),
      sharedInterests: z.array(z.string()),
      compatibilityReasons: z.array(z.string())
    })
    .nullable()
});

export type CurrentWeekWire = z.infer<typeof currentWeekWireSchema>;
