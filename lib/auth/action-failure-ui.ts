import {
  SERVER_ACTION_AUTH_MISCONFIGURED,
  SERVER_ACTION_EMPTY_RESPONSE,
  SERVER_ACTION_HTTP_ERROR,
  SERVER_ACTION_INVALID_JSON,
  SERVER_ACTION_RESPONSE_CONTRACT
} from "@/lib/auth/action-auth";

/** True when dev bearer / auth mode setup is wrong — show “API setup” style messaging. */
export function isAuthMisconfiguredCode(code?: string): boolean {
  return code === SERVER_ACTION_AUTH_MISCONFIGURED;
}

/** True when the response was not usable JSON or failed wire validation — not an env/setup issue. */
export function isResponseIntegrityCode(code?: string): boolean {
  return (
    code === SERVER_ACTION_RESPONSE_CONTRACT ||
    code === SERVER_ACTION_INVALID_JSON ||
    code === SERVER_ACTION_EMPTY_RESPONSE
  );
}

export function isHttpErrorCode(code?: string): boolean {
  return code === SERVER_ACTION_HTTP_ERROR;
}
