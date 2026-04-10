import "server-only";

import type { ZodType } from "zod";

import { ApiOriginMisconfiguredError, resolveInternalApiOrigin } from "@/lib/api/origin";
import {
  DEV_BEARER_SETUP_MESSAGE,
  type ApiErrorBody,
  type DevBearerResult,
  issuesFromApiBody
} from "@/lib/api/errors";
import { resolveAuthModeForServer } from "@/lib/auth/server-user";

export type { DevBearerResult } from "@/lib/api/errors";

/**
 * Server-only JSON calls to this app’s `/api/*` routes.
 *
 * **DEV BEARER ONLY:** sends `Authorization: Bearer ${DEV_AUTH_TOKEN}`.
 * There is no cookie/session or provider forwarding. Do not use this helper
 * expecting production auth until a separate integration exists.
 */
export type DevBearerRequestOptions = {
  /** e.g. `GET /api/profile` returns 404 for “no profile” — not a JSON success body. */
  notFoundStatuses?: readonly number[];
};

function staticDevBearerMisconfigurationMessage(): string | null {
  const mode = resolveAuthModeForServer();
  if (mode !== "dev") {
    return "Authenticated server→/api calls use dev bearer only. This runtime is not in dev auth mode (set AUTH_MODE=dev where you intend dev bearer, or run with NODE_ENV=development). Cookie/provider auth is not wired through this helper.";
  }
  if (process.env.DEV_AUTH_ENABLED !== "true") {
    return "DEV_AUTH_ENABLED must be true for dev-bearer API calls to authenticate (see docs/api-contracts.md).";
  }
  const token = process.env.DEV_AUTH_TOKEN?.trim();
  if (!token) {
    return DEV_BEARER_SETUP_MESSAGE;
  }
  return null;
}

function mergeHeaders(bearer: Headers, init?: RequestInit): Headers {
  const merged = new Headers(bearer);
  if (init?.headers) {
    const extra = new Headers(init.headers as HeadersInit);
    extra.forEach((value, key) => merged.set(key, value));
  }
  return merged;
}

function errorMessageFromMaybeJsonBody(text: string, fallback: string): string {
  if (text.length === 0) return fallback;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const err = (parsed as ApiErrorBody).error;
      if (typeof err === "string" && err.length > 0) return err;
    }
  } catch {
    /* use fallback */
  }
  return fallback;
}

/**
 * Fetch JSON from `/api/*` with dev bearer, validate 2xx bodies with `successSchema`,
 * normalize errors. Does not cast null/invalid JSON to T on success.
 */
export async function devBearerApiJson<T>(
  path: string,
  init: RequestInit,
  successSchema: ZodType<T>,
  options: DevBearerRequestOptions = {}
): Promise<DevBearerResult<T>> {
  const misMsg = staticDevBearerMisconfigurationMessage();
  if (misMsg) {
    return { ok: false, reason: "misconfigured", message: misMsg };
  }

  let origin: string;
  try {
    origin = await resolveInternalApiOrigin();
  } catch (error) {
    const message =
      error instanceof ApiOriginMisconfiguredError ? error.message : "Could not resolve API base URL.";
    return { ok: false, reason: "misconfigured", message };
  }

  const urlPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${origin}${urlPath}`;

  const bearer = new Headers();
  bearer.set("Authorization", `Bearer ${process.env.DEV_AUTH_TOKEN!}`);

  const merged = mergeHeaders(bearer, init);
  if (init.body !== undefined && !merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: merged,
      cache: "no-store"
    });
  } catch {
    return {
      ok: false,
      reason: "http",
      status: 0,
      message: "Network error calling the API."
    };
  }

  let text: string;
  try {
    text = await response.text();
  } catch {
    return {
      ok: false,
      reason: "empty_response",
      status: response.status,
      message: "Could not read the API response body."
    };
  }
  const notFoundStatuses = options.notFoundStatuses ?? [];

  if (notFoundStatuses.includes(response.status)) {
    return {
      ok: false,
      reason: "not_found",
      status: response.status,
      message: errorMessageFromMaybeJsonBody(text, "Not found.")
    };
  }

  if (response.status < 200 || response.status >= 300) {
    if (text.length === 0) {
      return {
        ok: false,
        reason: "empty_response",
        status: response.status,
        message: "API returned an empty error response body."
      };
    }
    try {
      const parsedErr = JSON.parse(text) as unknown;
      if (typeof parsedErr !== "object" || parsedErr === null || Array.isArray(parsedErr)) {
        return {
          ok: false,
          reason: "http_error",
          status: response.status,
          message:
            "The server returned a JSON error body that was not a JSON object (unexpected for this API)."
        };
      }
      const errorBody = parsedErr as ApiErrorBody;
      return {
        ok: false,
        reason: "http",
        status: response.status,
        message:
          typeof errorBody.error === "string" && errorBody.error.length > 0
            ? errorBody.error
            : response.statusText || "Request failed.",
        issues: issuesFromApiBody(errorBody),
        bodyCode: typeof errorBody.code === "string" ? errorBody.code : undefined
      };
    } catch {
      return {
        ok: false,
        reason: "http_error",
        status: response.status,
        message:
          "The server returned a non-JSON error response (often an HTML or proxy error page), not a normal API error payload."
      };
    }
  }

  if (text.length === 0) {
    return {
      ok: false,
      reason: "empty_response",
      status: response.status,
      message: "API returned an empty body where JSON was expected."
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return {
      ok: false,
      reason: "invalid_json",
      status: response.status,
      message: "API returned success but the response was not valid JSON."
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      reason: "invalid_json",
      status: response.status,
      message: "API returned success but the body was not a JSON object."
    };
  }

  const validated = successSchema.safeParse(parsed);
  if (!validated.success) {
    if (process.env.NODE_ENV === "development") {
      console.error("[devBearerApiJson] response contract mismatch", urlPath, validated.error.flatten());
    }
    return {
      ok: false,
      reason: "response_contract",
      status: response.status,
      message:
        "The server returned data in an unexpected shape. This is usually a client/API version mismatch, not a sign-in problem."
    };
  }

  return { ok: true, data: validated.data, status: response.status };
}
