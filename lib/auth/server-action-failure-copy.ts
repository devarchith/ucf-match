import { isAuthMisconfiguredCode, isResponseIntegrityCode } from "@/lib/auth/action-failure-ui";
import {
  SERVER_ACTION_AUTH_IDENTITY_MISMATCH,
  SERVER_ACTION_CONFLICT,
  SERVER_ACTION_EMPTY_RESPONSE,
  SERVER_ACTION_FORBIDDEN,
  SERVER_ACTION_HTTP_ERROR,
  SERVER_ACTION_INVALID_JSON,
  SERVER_ACTION_NETWORK_FAILURE,
  SERVER_ACTION_NOT_FOUND,
  SERVER_ACTION_RESPONSE_CONTRACT,
  SERVER_ACTION_SERVER_ERROR,
  SERVER_ACTION_UNAUTHORIZED
} from "@/lib/auth/action-auth";
import { NETWORK_ERROR_MESSAGE } from "@/lib/validation/zod-issues";

/** Short alert title for server action failures (report/block/flows). */
export function serverActionFailureTitle(code?: string): string {
  if (code === SERVER_ACTION_AUTH_IDENTITY_MISMATCH) return "Session mismatch";
  if (isAuthMisconfiguredCode(code)) return "API setup required";
  if (code === SERVER_ACTION_EMPTY_RESPONSE) return "Empty API response";
  if (code === SERVER_ACTION_INVALID_JSON) return "Invalid JSON from API";
  if (code === SERVER_ACTION_RESPONSE_CONTRACT) return "Unexpected API shape";
  if (isResponseIntegrityCode(code)) return "Unexpected API response";
  if (code === SERVER_ACTION_HTTP_ERROR) return "Unexpected server response";
  if (code === SERVER_ACTION_NETWORK_FAILURE) return "Connection problem";
  if (code === SERVER_ACTION_UNAUTHORIZED) return "Not signed in";
  if (code === SERVER_ACTION_FORBIDDEN) return "Not allowed";
  if (code === SERVER_ACTION_NOT_FOUND) return "Not found";
  if (code === SERVER_ACTION_CONFLICT) return "Conflict";
  if (code === SERVER_ACTION_SERVER_ERROR) return "Server error";
  return "Request failed";
}

/**
 * Map an unexpected throw from the client `startTransition` boundary (not a structured action result).
 * Uses the same titles as mapped failures; treats obvious fetch/network errors as connection problems.
 */
export function presentClientThrownActionFailure(error: unknown): { title: string; message: string } {
  const raw = error instanceof Error ? error.message.trim() : "";
  const lower = raw.toLowerCase();
  const networkLike =
    error instanceof TypeError ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("load failed") ||
    lower.includes("network request failed") ||
    lower.includes("ecconnrefused") ||
    lower.includes("econnreset");
  if (networkLike) {
    return {
      title: serverActionFailureTitle(SERVER_ACTION_NETWORK_FAILURE),
      message: NETWORK_ERROR_MESSAGE
    };
  }
  return {
    title: serverActionFailureTitle(undefined),
    message: raw.length > 0 ? raw : "An unexpected error occurred."
  };
}
