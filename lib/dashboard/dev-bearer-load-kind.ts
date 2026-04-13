import type { DevBearerResult } from "@/lib/api/errors";

export type DashboardDevBearerLoadKind =
  | "identity_mismatch"
  | "auth_misconfigured"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "generic_http"
  | "network"
  | "empty_response"
  | "invalid_json"
  | "response_contract"
  | "server_error"
  | "http_error"
  | "unexpected";

type Failed<T> = Extract<DevBearerResult<T>, { ok: false }>;

export function dashboardKindFromDevBearerFailure<T>(r: Failed<T>): DashboardDevBearerLoadKind {
  switch (r.reason) {
    case "misconfigured":
      return "auth_misconfigured";
    case "not_found":
      return "not_found";
    case "empty_response":
      return "empty_response";
    case "invalid_json":
      return "invalid_json";
    case "response_contract":
      return "response_contract";
    case "http_error":
      return "http_error";
    case "http": {
      if (r.status === 0) return "network";
      if (r.status === 401) return "unauthorized";
      if (r.status === 403) return "forbidden";
      if (r.status === 404) return "not_found";
      if (r.status === 409) return "conflict";
      if (r.status >= 500) return "server_error";
      return "generic_http";
    }
    default:
      return "unexpected";
  }
}
