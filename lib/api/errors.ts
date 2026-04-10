import type { SerializedZodIssue } from "@/lib/validation/zod-issues";

/** User-safe copy when dev-bearer server integration cannot run (not “please sign in”). */
export const DEV_BEARER_SETUP_MESSAGE =
  "This server cannot call authenticated APIs: set DEV_AUTH_ENABLED=true, DEV_AUTH_TOKEN, and NEXT_PUBLIC_APP_URL if Host headers are missing. Provider auth is not supported for this path yet.";

export type DevBearerFailureReason =
  | "misconfigured"
  | "not_found"
  | "http"
  | "http_error"
  | "empty_response"
  | "invalid_json"
  | "response_contract";

export type DevBearerResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; reason: "not_found"; status: number; message: string }
  | { ok: false; reason: "misconfigured"; message: string }
  | {
      ok: false;
      reason: "http";
      status: number;
      message: string;
      issues?: SerializedZodIssue[];
      /** From JSON error body `code` when present (e.g. auth operational codes). */
      bodyCode?: string;
    }
  | { ok: false; reason: "empty_response"; status: number; message: string }
  | { ok: false; reason: "invalid_json"; status: number; message: string }
  | { ok: false; reason: "response_contract"; status: number; message: string }
  | { ok: false; reason: "http_error"; status: number; message: string };

export type ApiErrorBody = {
  error?: string;
  code?: string;
  issues?: Array<{ path?: unknown; message?: unknown }>;
};

/** Normalize Zod-style paths from API JSON: empty path → "_root" (matches serializeZodIssues). */
export function normalizeApiIssuePath(path: unknown): string {
  if (!Array.isArray(path) || path.length === 0) {
    return "_root";
  }
  return path.map(String).join(".");
}

export function issuesFromApiBody(body: ApiErrorBody): SerializedZodIssue[] | undefined {
  if (!body.issues?.length) {
    return undefined;
  }
  return body.issues.map((issue) => ({
    path: normalizeApiIssuePath(issue.path),
    message: typeof issue.message === "string" ? issue.message : "Invalid value."
  }));
}
