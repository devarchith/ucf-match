"use server";

import { AuthError } from "@/lib/auth";
import { SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import { getServerUserId } from "@/lib/auth/server-user";
import { WeekServiceError, optIntoActiveWeek } from "@/lib/week";

export type WeekOptInResult =
  | { ok: true; data: Awaited<ReturnType<typeof optIntoActiveWeek>> }
  | { ok: false; message: string; code?: typeof SERVER_ACTION_UNAUTHORIZED };

export async function optIntoActiveWeekAction(): Promise<WeekOptInResult> {
  try {
    const userId = await getServerUserId();
    const data = await optIntoActiveWeek(userId);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        code: SERVER_ACTION_UNAUTHORIZED,
        message: "You are not signed in."
      };
    }
    if (error instanceof WeekServiceError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Could not opt in. Try again." };
  }
}
