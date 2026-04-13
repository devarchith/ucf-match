import "server-only";

import { devBearerApiJson } from "@/lib/api/authenticated-server-client";
import { meWireSchema, type MeWire } from "@/lib/api/contracts/me";
import type { DevBearerResult } from "@/lib/api/errors";

export type { MeWire };

export async function fetchMeFromApi(): Promise<DevBearerResult<MeWire>> {
  return devBearerApiJson("/api/me", { method: "GET" }, meWireSchema, { notFoundStatuses: [404] });
}
