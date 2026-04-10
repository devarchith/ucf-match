"use server";

import { checkServerActionApiIdentity } from "@/lib/api/assert-action-identity";
import { devBearerApiJson } from "@/lib/api/authenticated-server-client";
import { AuthError } from "@/lib/auth";
import {
  weeklyMatchUpdatedWireSchema,
  type WeeklyMatchUpdatedWire
} from "@/lib/api/contracts/match-response";
import {
  mapDevBearerFailure,
  unexpectedMappedActionFailure,
  type MappedActionFailure
} from "@/lib/api/map-dev-bearer-to-action";
import { SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import { getServerUserId } from "@/lib/auth/server-user";
import type { SerializedZodIssue } from "@/lib/validation/zod-issues";

export type MatchResponseActionResult =
  | { ok: true; data: WeeklyMatchUpdatedWire }
  | MappedActionFailure
  | { ok: false; message: string; issues?: SerializedZodIssue[] };

export async function submitMatchResponseAction(
  matchId: string,
  response: "ACCEPTED" | "DECLINED"
): Promise<MatchResponseActionResult> {
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

  const trimmed = matchId.trim();
  if (!trimmed) {
    return { ok: false, message: "Match id is required." };
  }

  const result = await devBearerApiJson(
    `/api/matches/${encodeURIComponent(trimmed)}/response`,
    {
      method: "POST",
      body: JSON.stringify({ response })
    },
    weeklyMatchUpdatedWireSchema
  );

  if (!result.ok) {
    return mapDevBearerFailure(result);
  }

  return { ok: true, data: result.data };
}
