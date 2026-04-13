import "server-only";

import { headers } from "next/headers";

/** Thrown when this process cannot determine a safe same-origin base URL for server→/api fetch. */
export class ApiOriginMisconfiguredError extends Error {
  override readonly name = "ApiOriginMisconfiguredError";

  constructor(message: string) {
    super(message);
  }
}

/** Hostname part of Host / X-Forwarded-Host (handles bracketed IPv6 and :port). */
function hostnameFromHostHeader(hostHeader: string): string {
  const t = hostHeader.trim();
  if (t.startsWith("[")) {
    const end = t.indexOf("]");
    if (end === -1) {
      return t.toLowerCase();
    }
    return t.slice(1, end).toLowerCase();
  }
  const lastColon = t.lastIndexOf(":");
  if (lastColon > 0) {
    const after = t.slice(lastColon + 1);
    if (/^\d+$/.test(after)) {
      return t.slice(0, lastColon).toLowerCase();
    }
  }
  return t.toLowerCase();
}

/**
 * Request-derived Host must not drive bearer-authenticated internal fetches to arbitrary origins
 * (Host / X-Forwarded-Host are client-influenced on many deployments).
 */
function isDevLoopbackHostHeader(hostHeader: string): boolean {
  const hn = hostnameFromHostHeader(hostHeader);
  return hn === "localhost" || hn === "127.0.0.1" || hn === "::1";
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

  if (process.env.NODE_ENV === "production") {
    throw new ApiOriginMisconfiguredError(
      "Set NEXT_PUBLIC_APP_URL for server-side /api fetch in production. Request-derived Host is not used (avoids SSRF with internal Authorization headers)."
    );
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) {
    throw new ApiOriginMisconfiguredError(
      "Set NEXT_PUBLIC_APP_URL to this app’s public origin (e.g. http://localhost:3000), or run behind a request that provides a Host header."
    );
  }

  if (!isDevLoopbackHostHeader(host)) {
    throw new ApiOriginMisconfiguredError(
      "Server-side /api fetch refuses request-derived Host/X-Forwarded-Host unless it targets loopback (localhost / 127.0.0.1 / ::1). Set NEXT_PUBLIC_APP_URL for LAN or non-loopback dev (e.g. http://192.168.x.x:3000)."
    );
  }

  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
