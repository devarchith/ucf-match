import type { DevBearerResult } from "@/lib/api/errors";
import type { DashboardDevBearerLoadKind } from "@/lib/dashboard/dev-bearer-load-kind";

export type RscLoadFailureClass =
  | "auth_misconfigured"
  | "identity_mismatch"
  | "empty_response"
  | "invalid_json"
  | "response_contract"
  | "network"
  | "forbidden"
  | "not_found"
  | "unauthorized"
  | "conflict"
  | "server_error"
  | "http_error"
  | "generic_http"
  | "unknown";

export type RscLoadFailureView = {
  title: string;
  description: string;
  failureClass: RscLoadFailureClass;
};

type Failed<T> = Extract<DevBearerResult<T>, { ok: false }>;

/** Map a failed dev-bearer page load to titled error copy for RSC `PageStateGate` / `ErrorState`. */
export function presentDevBearerPageFailure<T>(result: Failed<T>): RscLoadFailureView {
  switch (result.reason) {
    case "misconfigured":
      return {
        title: "API setup required",
        description: result.message,
        failureClass: "auth_misconfigured"
      };
    case "empty_response":
      return {
        title: "Empty API response",
        description: result.message,
        failureClass: "empty_response"
      };
    case "invalid_json":
      return {
        title: "Invalid JSON from API",
        description: result.message,
        failureClass: "invalid_json"
      };
    case "response_contract":
      return {
        title: "Unexpected API shape",
        description: result.message,
        failureClass: "response_contract"
      };
    case "http_error":
      return {
        title: "Non-JSON error from server",
        description: result.message,
        failureClass: "http_error"
      };
    case "not_found":
      return {
        title: "Not found",
        description: result.message,
        failureClass: "not_found"
      };
    case "http": {
      if (result.status === 0) {
        return {
          title: "Network problem",
          description: result.message,
          failureClass: "network"
        };
      }
      if (result.status === 401) {
        return {
          title: "Not signed in",
          description: result.message,
          failureClass: "unauthorized"
        };
      }
      if (result.status === 403) {
        return {
          title: "Not allowed",
          description: result.message,
          failureClass: "forbidden"
        };
      }
      if (result.status === 404) {
        return {
          title: "Not found",
          description: result.message,
          failureClass: "not_found"
        };
      }
      if (result.status === 409) {
        return {
          title: "Conflict",
          description: result.message,
          failureClass: "conflict"
        };
      }
      if (result.status >= 500) {
        return {
          title: "Server error",
          description: result.message,
          failureClass: "server_error"
        };
      }
      return {
        title: "Request failed",
        description: result.message,
        failureClass: "generic_http"
      };
    }
  }
}

export function presentAuthIdentityMismatchPageFailure(message: string): RscLoadFailureView {
  return {
    title: "Session does not match API user",
    description: message,
    failureClass: "identity_mismatch"
  };
}

/** Dashboard load errors only carry `kind` + message (no full `DevBearerResult`). */
export function presentDashboardLoadKind(
  kind: DashboardDevBearerLoadKind,
  message: string
): RscLoadFailureView {
  switch (kind) {
    case "identity_mismatch":
      return {
        title: "Session does not match API user",
        description: message,
        failureClass: "identity_mismatch"
      };
    case "auth_misconfigured":
      return { title: "API setup required", description: message, failureClass: "auth_misconfigured" };
    case "empty_response":
      return { title: "Empty API response", description: message, failureClass: "empty_response" };
    case "invalid_json":
      return { title: "Invalid JSON from API", description: message, failureClass: "invalid_json" };
    case "response_contract":
      return { title: "Unexpected API shape", description: message, failureClass: "response_contract" };
    case "http_error":
      return { title: "Non-JSON error from server", description: message, failureClass: "http_error" };
    case "network":
      return { title: "Network problem", description: message, failureClass: "network" };
    case "unauthorized":
      return { title: "Not signed in", description: message, failureClass: "unauthorized" };
    case "forbidden":
      return { title: "Not allowed", description: message, failureClass: "forbidden" };
    case "not_found":
      return { title: "Not found", description: message, failureClass: "not_found" };
    case "server_error":
      return { title: "Server error", description: message, failureClass: "server_error" };
    case "conflict":
      return { title: "Conflict", description: message, failureClass: "conflict" };
    case "generic_http":
      return { title: "Request failed", description: message, failureClass: "generic_http" };
    case "unexpected":
      return { title: "Unexpected load error", description: message, failureClass: "unknown" };
  }
}
