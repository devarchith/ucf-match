"use server";

import { ZodError } from "zod";
import { getServerUserId } from "@/lib/auth/server-user";
import { ProfileServiceError, createOrUpdateProfile } from "@/lib/profile";
import { profileInputSchema } from "@/lib/validation/profile";
import { type SerializedZodIssue, serializeZodIssues } from "@/lib/validation/zod-issues";

export type ProfileActionResult =
  | { ok: true; data: Awaited<ReturnType<typeof createOrUpdateProfile>> }
  | { ok: false; message: string; issues?: SerializedZodIssue[] };

export async function submitProfileAction(payload: unknown): Promise<ProfileActionResult> {
  try {
    const userId = await getServerUserId();
    const input = profileInputSchema.parse(payload);
    const data = await createOrUpdateProfile(userId, input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid profile data.",
        issues
      };
    }
    if (error instanceof ProfileServiceError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Could not save profile. Try again." };
  }
}
