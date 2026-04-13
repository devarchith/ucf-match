import "server-only";

import { devBearerApiJson } from "@/lib/api/authenticated-server-client";
import { currentWeekWireSchema, type CurrentWeekWire } from "@/lib/api/contracts/week-current";
import type { DevBearerResult } from "@/lib/api/errors";

export type { CurrentWeekWire };

export async function fetchCurrentWeekFromApi(): Promise<DevBearerResult<CurrentWeekWire>> {
  return devBearerApiJson("/api/weeks/current", { method: "GET" }, currentWeekWireSchema);
}
