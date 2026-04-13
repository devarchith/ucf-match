import "server-only";

import { devBearerApiJson } from "@/lib/api/authenticated-server-client";
import { profileWireSchema, type ProfileWire } from "@/lib/api/contracts/profile";
import type { DevBearerResult } from "@/lib/api/errors";
import type { OnboardingDraft } from "@/lib/mock/flows";

export type { ProfileWire };

export async function fetchProfileFromApi(): Promise<DevBearerResult<ProfileWire>> {
  return devBearerApiJson("/api/profile", { method: "GET" }, profileWireSchema, {
    notFoundStatuses: [404]
  });
}

/** Hydrate onboarding from GET /api/profile — `bio` maps 1:1 to the API field. */
export function profileApiToOnboardingDraft(p: ProfileWire): OnboardingDraft {
  return {
    firstName: p.firstName?.trim() ?? "",
    lastName: p.lastName?.trim() ?? "",
    major: p.major?.trim() ?? "",
    graduationYear: p.graduationYear != null ? String(p.graduationYear) : "",
    bio: p.bio?.trim() ?? ""
  };
}
