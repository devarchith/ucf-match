"use server";

import { z, ZodError } from "zod";
import { checkServerActionApiIdentity } from "@/lib/api/assert-action-identity";
import { devBearerApiJson } from "@/lib/api/authenticated-server-client";
import { AuthError } from "@/lib/auth";
import { preferencesWireSchema, type PreferencesWire } from "@/lib/api/contracts/preferences";
import {
  mapDevBearerFailure,
  unexpectedMappedActionFailure,
  type MappedActionFailure
} from "@/lib/api/map-dev-bearer-to-action";
import { SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import { getServerUserId } from "@/lib/auth/server-user";
import { serializeZodIssues } from "@/lib/validation/zod-issues";

const comfortSlidersBodySchema = z.object({
  campusAreaDistance: z.enum(["low", "medium", "high"]),
  conversationPace: z.enum(["low", "medium", "high"]),
  meetingWindows: z.enum(["low", "medium", "high"]),
  communicationStyle: z.string().trim().min(1).max(120).optional()
});

export type PreferencesActionResult = { ok: true; data: PreferencesWire } | MappedActionFailure;

export async function submitPreferencesAction(payload: unknown): Promise<PreferencesActionResult> {
  let userId: string;
  try {
    userId = await getServerUserId();
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        code: SERVER_ACTION_UNAUTHORIZED,
        message: "You are not signed in."
      };
    }
    return unexpectedMappedActionFailure(error);
  }

  const identityFailure = await checkServerActionApiIdentity(userId);
  if (identityFailure) {
    return identityFailure;
  }

  let input;
  try {
    input = comfortSlidersBodySchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid preferences data.",
        issues
      };
    }
    return unexpectedMappedActionFailure(error);
  }

  const result = await devBearerApiJson(
    "/api/preferences",
    { method: "PUT", body: JSON.stringify(input) },
    preferencesWireSchema
  );

  if (!result.ok) {
    return mapDevBearerFailure(result);
  }

  return { ok: true, data: result.data };
}
