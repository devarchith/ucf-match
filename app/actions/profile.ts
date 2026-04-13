"use server";

import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";
import { checkServerActionApiIdentity } from "@/lib/api/assert-action-identity";
import { devBearerApiJson } from "@/lib/api/authenticated-server-client";
import { profileWireSchema, type ProfileWire } from "@/lib/api/contracts/profile";
import {
  mapDevBearerFailure,
  unexpectedMappedActionFailure,
  type MappedActionFailure
} from "@/lib/api/map-dev-bearer-to-action";
import { SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import { getServerUserId } from "@/lib/auth/server-user";
import { profileInputSchema } from "@/lib/validation/profile";
import { serializeZodIssues } from "@/lib/validation/zod-issues";

export type ProfileActionResult = { ok: true; data: ProfileWire } | MappedActionFailure;

export async function submitProfileAction(payload: unknown): Promise<ProfileActionResult> {
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
    input = profileInputSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid profile data.",
        issues
      };
    }
    return unexpectedMappedActionFailure(error);
  }

  const result = await devBearerApiJson("/api/profile", { method: "PUT", body: JSON.stringify(input) }, profileWireSchema);

  if (!result.ok) {
    return mapDevBearerFailure(result);
  }

  return { ok: true, data: result.data };
}
