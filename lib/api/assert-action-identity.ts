import "server-only";

import { fetchMeFromApi } from "@/lib/api/me-api";
import { mapDevBearerFailure, type MappedActionFailure } from "@/lib/api/map-dev-bearer-to-action";
import { AuthIdentityMismatchError } from "@/lib/auth/auth-identity-mismatch-error";
import { SERVER_ACTION_AUTH_IDENTITY_MISMATCH } from "@/lib/auth/action-auth";

/**
 * Ensures `DEV_AUTH_USER_ID` matches bearer-backed `/api/me` before mutating via server actions.
 * Returns a mapped failure when /api/me cannot be read or identities diverge.
 */
export async function checkServerActionApiIdentity(
  sessionUserId: string
): Promise<MappedActionFailure | null> {
  const meRes = await fetchMeFromApi();
  if (!meRes.ok) {
    return mapDevBearerFailure(meRes);
  }
  if (meRes.data.userId !== sessionUserId) {
    return {
      ok: false,
      code: SERVER_ACTION_AUTH_IDENTITY_MISMATCH,
      message: new AuthIdentityMismatchError().message
    };
  }
  return null;
}
