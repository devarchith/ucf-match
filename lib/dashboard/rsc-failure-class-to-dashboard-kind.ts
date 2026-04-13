import type { RscLoadFailureClass } from "@/lib/frontend/rsc-dev-bearer-failure";
import type { DashboardDevBearerLoadKind } from "@/lib/dashboard/dev-bearer-load-kind";

/** Map RSC failure class (from `/api/me` gate) to dashboard load error kind. */
export function dashboardKindFromRscFailureClass(c: RscLoadFailureClass): DashboardDevBearerLoadKind {
  switch (c) {
    case "identity_mismatch":
      return "identity_mismatch";
    case "auth_misconfigured":
      return "auth_misconfigured";
    case "empty_response":
      return "empty_response";
    case "invalid_json":
      return "invalid_json";
    case "response_contract":
      return "response_contract";
    case "http_error":
      return "http_error";
    case "network":
      return "network";
    case "unauthorized":
      return "unauthorized";
    case "forbidden":
      return "forbidden";
    case "not_found":
      return "not_found";
    case "conflict":
      return "conflict";
    case "server_error":
      return "server_error";
    case "generic_http":
      return "generic_http";
    case "unknown":
      return "unexpected";
  }
}
