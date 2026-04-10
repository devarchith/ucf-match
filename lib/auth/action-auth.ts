/** Returned when the user is not authenticated for the server action (e.g. API 401). */
export const SERVER_ACTION_UNAUTHORIZED = "UNAUTHORIZED" as const;

/**
 * Dev-bearer server→/api integration is misconfigured (missing token, wrong AUTH_MODE, bad origin, etc.).
 * Not an end-user “sign in” problem — ops / local env setup.
 */
export const SERVER_ACTION_AUTH_MISCONFIGURED = "AUTH_MISCONFIGURED" as const;

/** API returned 403 — authenticated but this action is not allowed (e.g. not a match participant). */
export const SERVER_ACTION_FORBIDDEN = "FORBIDDEN" as const;

/** API returned 409 — invalid state transition (e.g. match already closed). */
export const SERVER_ACTION_CONFLICT = "CONFLICT" as const;

/** API returned 404 where applicable (e.g. missing profile on GET). */
export const SERVER_ACTION_NOT_FOUND = "NOT_FOUND" as const;

/** Fetch failed before a normal HTTP response (status 0). */
export const SERVER_ACTION_NETWORK_FAILURE = "NETWORK_FAILURE" as const;

/** 2xx with empty body where JSON was required. */
export const SERVER_ACTION_EMPTY_RESPONSE = "EMPTY_RESPONSE" as const;

/** Body was not valid JSON (or not a JSON object on success). */
export const SERVER_ACTION_INVALID_JSON = "INVALID_JSON" as const;

/** Parsed JSON did not match the expected wire schema (distinct from env/setup failures). */
export const SERVER_ACTION_RESPONSE_CONTRACT = "RESPONSE_CONTRACT" as const;

/** HTTP 5xx or other non-classified server errors from /api. */
export const SERVER_ACTION_SERVER_ERROR = "SERVER_ERROR" as const;

/**
 * Error response was not parseable JSON (e.g. HTML/proxy page) — distinct from client JSON bugs on 2xx.
 */
export const SERVER_ACTION_HTTP_ERROR = "HTTP_ERROR" as const;

/** Session/env user id does not match /api/me user id — fail closed; fix dev identity env alignment. */
export const SERVER_ACTION_AUTH_IDENTITY_MISMATCH = "AUTH_IDENTITY_MISMATCH" as const;

/** Non–dev-bearer failure: unexpected runtime / catch path surfaced as a structured action result. */
export const SERVER_ACTION_UNEXPECTED = "UNEXPECTED" as const;

export type ServerActionUnauthorized = typeof SERVER_ACTION_UNAUTHORIZED;
export type ServerActionAuthMisconfigured = typeof SERVER_ACTION_AUTH_MISCONFIGURED;
export type ServerActionForbidden = typeof SERVER_ACTION_FORBIDDEN;
export type ServerActionConflict = typeof SERVER_ACTION_CONFLICT;
export type ServerActionNotFound = typeof SERVER_ACTION_NOT_FOUND;
export type ServerActionNetworkFailure = typeof SERVER_ACTION_NETWORK_FAILURE;
export type ServerActionEmptyResponse = typeof SERVER_ACTION_EMPTY_RESPONSE;
export type ServerActionInvalidJson = typeof SERVER_ACTION_INVALID_JSON;
export type ServerActionResponseContract = typeof SERVER_ACTION_RESPONSE_CONTRACT;
export type ServerActionServerError = typeof SERVER_ACTION_SERVER_ERROR;
export type ServerActionHttpError = typeof SERVER_ACTION_HTTP_ERROR;
export type ServerActionAuthIdentityMismatch = typeof SERVER_ACTION_AUTH_IDENTITY_MISMATCH;
export type ServerActionUnexpected = typeof SERVER_ACTION_UNEXPECTED;
