import type { DevBearerResult } from "@/lib/api/errors";
import {
  SERVER_ACTION_AUTH_IDENTITY_MISMATCH,
  SERVER_ACTION_AUTH_MISCONFIGURED,
  SERVER_ACTION_CONFLICT,
  SERVER_ACTION_EMPTY_RESPONSE,
  SERVER_ACTION_FORBIDDEN,
  SERVER_ACTION_HTTP_ERROR,
  SERVER_ACTION_INVALID_JSON,
  SERVER_ACTION_NETWORK_FAILURE,
  SERVER_ACTION_NOT_FOUND,
  SERVER_ACTION_RESPONSE_CONTRACT,
  SERVER_ACTION_SERVER_ERROR,
  SERVER_ACTION_UNEXPECTED,
  SERVER_ACTION_UNAUTHORIZED
} from "@/lib/auth/action-auth";
import type { SerializedZodIssue } from "@/lib/validation/zod-issues";

export type MappedActionFailure = {
  ok: false;
  message: string;
  issues?: SerializedZodIssue[];
  code?:
    | typeof SERVER_ACTION_UNAUTHORIZED
    | typeof SERVER_ACTION_AUTH_IDENTITY_MISMATCH
    | typeof SERVER_ACTION_AUTH_MISCONFIGURED
    | typeof SERVER_ACTION_FORBIDDEN
    | typeof SERVER_ACTION_CONFLICT
    | typeof SERVER_ACTION_NOT_FOUND
    | typeof SERVER_ACTION_NETWORK_FAILURE
    | typeof SERVER_ACTION_EMPTY_RESPONSE
    | typeof SERVER_ACTION_INVALID_JSON
    | typeof SERVER_ACTION_RESPONSE_CONTRACT
    | typeof SERVER_ACTION_SERVER_ERROR
    | typeof SERVER_ACTION_HTTP_ERROR
    | typeof SERVER_ACTION_UNEXPECTED;
};

type FailedDevBearer<T> = Extract<DevBearerResult<T>, { ok: false }>;

/** Map a failed dev-bearer fetch to a consistent server-action error shape. */
export function mapDevBearerFailure<T>(result: FailedDevBearer<T>): MappedActionFailure {
  switch (result.reason) {
    case "misconfigured":
      return {
        ok: false,
        code: SERVER_ACTION_AUTH_MISCONFIGURED,
        message: result.message
      };
    case "empty_response":
      return {
        ok: false,
        code: SERVER_ACTION_EMPTY_RESPONSE,
        message: result.message
      };
    case "invalid_json":
      return {
        ok: false,
        code: SERVER_ACTION_INVALID_JSON,
        message: result.message
      };
    case "response_contract":
      return {
        ok: false,
        code: SERVER_ACTION_RESPONSE_CONTRACT,
        message: result.message
      };
    case "http_error":
      return {
        ok: false,
        code: SERVER_ACTION_HTTP_ERROR,
        message: result.message
      };
    case "not_found":
      return {
        ok: false,
        code: SERVER_ACTION_NOT_FOUND,
        message: result.message
      };
    case "http": {
      if (result.status === 0) {
        return {
          ok: false,
          code: SERVER_ACTION_NETWORK_FAILURE,
          message: result.message
        };
      }
      if (result.status === 401) {
        return {
          ok: false,
          code: SERVER_ACTION_UNAUTHORIZED,
          message: result.message
        };
      }
      if (result.status === 403) {
        return {
          ok: false,
          code: SERVER_ACTION_FORBIDDEN,
          message: result.message,
          issues: result.issues
        };
      }
      if (result.status === 404) {
        return {
          ok: false,
          code: SERVER_ACTION_NOT_FOUND,
          message: result.message,
          issues: result.issues
        };
      }
      if (result.status === 409) {
        return {
          ok: false,
          code: SERVER_ACTION_CONFLICT,
          message: result.message,
          issues: result.issues
        };
      }
      if (result.status >= 500) {
        return {
          ok: false,
          code: SERVER_ACTION_SERVER_ERROR,
          message: result.message,
          issues: result.issues
        };
      }
      return {
        ok: false,
        code: SERVER_ACTION_SERVER_ERROR,
        message: result.message,
        issues: result.issues
      };
    }
  }
}

/** Use instead of re-throwing from server actions when the failure is not a mapped dev-bearer result. */
export function unexpectedMappedActionFailure(error: unknown): MappedActionFailure {
  return {
    ok: false,
    code: SERVER_ACTION_UNEXPECTED,
    message:
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "An unexpected error occurred."
  };
}
