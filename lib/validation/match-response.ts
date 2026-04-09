import { z } from "zod";

export const weeklyMatchResponseBodySchema = z.object({
  response: z.enum(["ACCEPTED", "DECLINED"])
});

export type WeeklyMatchResponseBody = z.infer<typeof weeklyMatchResponseBodySchema>;
