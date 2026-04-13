"use server";

import { checkServerActionApiIdentity } from "@/lib/api/assert-action-identity";
import { devBearerApiJson } from "@/lib/api/authenticated-server-client";
import { AuthError } from "@/lib/auth";
import { weeklyOptInWireSchema, type WeeklyOptInWire } from "@/lib/api/contracts/participation";
import {
  mapDevBearerFailure,
  unexpectedMappedActionFailure,
  type MappedActionFailure
} from "@/lib/api/map-dev-bearer-to-action";
import { SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import { getServerUserId } from "@/lib/auth/server-user";

export type WeekOptInResult = { ok: true; data: WeeklyOptInWire } | MappedActionFailure;

export async function optIntoActiveWeekAction(): Promise<WeekOptInResult> {
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

  const result = await devBearerApiJson(
    "/api/weeks/current/opt-in",
    { method: "PUT" },
    weeklyOptInWireSchema
  );

  if (!result.ok) {
    return mapDevBearerFailure(result);
  }

  return { ok: true, data: result.data };
}
