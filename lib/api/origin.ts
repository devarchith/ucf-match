import "server-only";

import { headers } from "next/headers";
import {
  ApiOriginMisconfiguredError,
  resolveInternalApiOriginSync
} from "@/lib/api/resolve-internal-origin";

export { ApiOriginMisconfiguredError } from "@/lib/api/resolve-internal-origin";

/**
 * Base URL for server-side fetch to this app’s Route Handlers.
 * No silent localhost fallback: misconfiguration must be explicit (see error message).
 *
 * @param headersForTest — optional; unit tests only. When set, used instead of `next/headers` (production code never passes this).
 */
export async function resolveInternalApiOrigin(
  headersForTest?: () => Promise<Headers>
): Promise<string> {
  const h = headersForTest ? await headersForTest() : await headers();
  return resolveInternalApiOriginSync(process.env, h);
}
