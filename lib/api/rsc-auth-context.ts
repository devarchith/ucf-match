import "server-only";

import { fetchCurrentWeekFromApi } from "@/lib/api/current-week-api";
import { loadAndAssertApiIdentity } from "@/lib/api/load-and-assert-api-identity";
import { fetchProfileFromApi, profileApiToOnboardingDraft } from "@/lib/api/profile-api";
import type { CurrentWeekWire } from "@/lib/api/contracts/week-current";
import { presentDevBearerPageFailure, type RscLoadFailureView } from "@/lib/frontend/rsc-dev-bearer-failure";
import type { OnboardingDraft } from "@/lib/mock/flows";

export type WeekIdentityResult =
  | { ok: true; week: CurrentWeekWire }
  | { ok: false; failure: RscLoadFailureView };

/** Shared for weekly opt-in + match reveal: week wire + fail-closed session/API identity match. */
export async function loadWeekPageContext(sessionUserId: string): Promise<WeekIdentityResult> {
  const [weekRes, identityGate] = await Promise.all([
    fetchCurrentWeekFromApi(),
    loadAndAssertApiIdentity(sessionUserId)
  ]);
  if (!identityGate.ok) {
    return { ok: false, failure: identityGate.failure };
  }
  if (!weekRes.ok) {
    return { ok: false, failure: presentDevBearerPageFailure(weekRes) };
  }
  return { ok: true, week: weekRes.data };
}

export type OnboardingProfileResult =
  | { ok: true; initialDraft: OnboardingDraft | undefined }
  | { ok: false; failure: RscLoadFailureView };

export async function loadOnboardingProfileContext(
  sessionUserId: string
): Promise<OnboardingProfileResult> {
  const [profileRes, identityGate] = await Promise.all([
    fetchProfileFromApi(),
    loadAndAssertApiIdentity(sessionUserId)
  ]);
  if (!identityGate.ok) {
    return { ok: false, failure: identityGate.failure };
  }
  if (profileRes.ok) {
    return { ok: true, initialDraft: profileApiToOnboardingDraft(profileRes.data) };
  }
  if (profileRes.reason === "not_found") {
    return { ok: true, initialDraft: undefined };
  }
  return { ok: false, failure: presentDevBearerPageFailure(profileRes) };
}
