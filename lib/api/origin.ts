import "server-only";

import { headers } from "next/headers";

/** Thrown when this process cannot determine a safe same-origin base URL for server→/api fetch. */
export class ApiOriginMisconfiguredError extends Error {
  override readonly name = "ApiOriginMisconfiguredError";

  constructor(message: string) {
    super(message);
  }
}

/**
 * Base URL for server-side fetch to this app’s Route Handlers.
 * No silent localhost fallback: misconfiguration must be explicit (see error message).
 */
export async function resolveInternalApiOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) {
    throw new ApiOriginMisconfiguredError(
      "Set NEXT_PUBLIC_APP_URL to this app’s public origin (e.g. http://localhost:3000), or run behind a request that provides a Host header."
    );
  }

  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
