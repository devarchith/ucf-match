import "server-only";

import { AuthError, AuthOperationalError } from "@/lib/auth";
import { AuthIdentityMismatchError } from "@/lib/auth/auth-identity-mismatch-error";
import {
  presentAuthIdentityMismatchPageFailure,
  type RscLoadFailureView
} from "@/lib/frontend/rsc-dev-bearer-failure";

/**
 * Map unexpected throws from RSC loaders into the same titled buckets as structured dev-bearer failures.
 * Does not replace `{ ok: false, failure }` paths — only catch boundaries that would otherwise show a second generic UX.
 */
export function presentRscThrownLoaderFailure(error: unknown): RscLoadFailureView {
  if (error instanceof AuthIdentityMismatchError) {
    return presentAuthIdentityMismatchPageFailure(error.message);
  }
  if (error instanceof AuthOperationalError && error.code === "AUTH_MISCONFIGURED") {
    return {
      title: "API setup required",
      description: error.message,
      failureClass: "auth_misconfigured"
    };
  }
  if (error instanceof AuthError) {
    if (error.status === 401) {
      return {
        title: "Not signed in",
        description: error.message,
        failureClass: "unauthorized"
      };
    }
    if (error.status === 403) {
      return {
        title: "Not allowed",
        description: error.message,
        failureClass: "forbidden"
      };
    }
  }
  const description =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : "An unexpected error occurred while loading this page.";
  return {
    title: "Unexpected load error",
    description,
    failureClass: "unknown"
  };
}
