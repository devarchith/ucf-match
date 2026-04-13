import "server-only";

import { fetchMeFromApi } from "@/lib/api/me-api";
import type { MeWire } from "@/lib/api/contracts/me";
import { AuthIdentityMismatchError } from "@/lib/auth/auth-identity-mismatch-error";
import {
  presentAuthIdentityMismatchPageFailure,
  presentDevBearerPageFailure,
  type RscLoadFailureView
} from "@/lib/frontend/rsc-dev-bearer-failure";

export type ApiIdentityGateOk = { ok: true; me: MeWire };
export type ApiIdentityGateFail = { ok: false; failure: RscLoadFailureView };
export type ApiIdentityGateResult = ApiIdentityGateOk | ApiIdentityGateFail;

/**
 * First step for any RSC route that combines session gating with bearer-backed user data:
 * load `/api/me`, then fail closed if session user id ≠ API user id.
 * Returns structured failures only — does not throw for identity mismatch or API errors.
 */
export async function loadAndAssertApiIdentity(sessionUserId: string): Promise<ApiIdentityGateResult> {
  const meRes = await fetchMeFromApi();
  if (!meRes.ok) {
    return { ok: false, failure: presentDevBearerPageFailure(meRes) };
  }
  if (sessionUserId !== meRes.data.userId) {
    const err = new AuthIdentityMismatchError();
    return { ok: false, failure: presentAuthIdentityMismatchPageFailure(err.message) };
  }
  return { ok: true, me: meRes.data };
}
