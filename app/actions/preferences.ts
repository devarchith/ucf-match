"use server";

import { ZodError } from "zod";
import { getServerUserId } from "@/lib/auth/server-user";
import { PreferencesServiceError, submitPreferences } from "@/lib/preferences";
import { preferencesInputSchema } from "@/lib/validation/preferences";
import { type SerializedZodIssue, serializeZodIssues } from "@/lib/validation/zod-issues";

export type PreferencesActionResult =
  | { ok: true; data: Awaited<ReturnType<typeof submitPreferences>> }
  | { ok: false; message: string; issues?: SerializedZodIssue[] };

export async function submitPreferencesAction(payload: unknown): Promise<PreferencesActionResult> {
  try {
    const userId = await getServerUserId();
    const input = preferencesInputSchema.parse(payload);
    const data = await submitPreferences(userId, input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid preferences data.",
        issues
      };
    }
    if (error instanceof PreferencesServiceError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Could not save preferences. Try again." };
  }
}
