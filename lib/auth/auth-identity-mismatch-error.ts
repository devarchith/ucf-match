import { SERVER_ACTION_AUTH_IDENTITY_MISMATCH } from "@/lib/auth/action-auth";

/** Thrown when `DEV_AUTH_USER_ID` (session) and bearer-backed `/api/me` disagree — never render mixed user state. */
export class AuthIdentityMismatchError extends Error {
  override readonly name = "AuthIdentityMismatchError";

  readonly code = SERVER_ACTION_AUTH_IDENTITY_MISMATCH;

  constructor(
    message = "Your session user does not match the API-authenticated user. Align DEV_AUTH_USER_ID with the account your DEV_AUTH_TOKEN represents, then reload."
  ) {
    super(message);
  }
}
