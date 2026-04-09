import "server-only";

import { AuthError } from "@/lib/auth";

function resolveAuthModeForServer(): "dev" | "provider" {
  const explicit = process.env.AUTH_MODE;
  if (explicit === "dev" || explicit === "provider") {
    return explicit;
  }
  if (process.env.NODE_ENV === "development") {
    return "dev";
  }
  return "provider";
}

/**
 * Resolves the authenticated user id for server actions and RSC data loads.
 * In development with dev auth enabled, uses DEV_AUTH_USER_ID (aligned with API dev auth).
 */
export async function getServerUserId(): Promise<string> {
  const mode = resolveAuthModeForServer();
  if (mode !== "dev") {
    throw new AuthError("Unauthorized", 401);
  }
  if (process.env.DEV_AUTH_ENABLED !== "true") {
    throw new AuthError("Unauthorized", 401);
  }
  const userId = process.env.DEV_AUTH_USER_ID;
  if (!userId) {
    throw new AuthError("Unauthorized", 401);
  }
  return userId;
}

export type ResolvedServerSession =
  | { status: "authed"; userId: string }
  | { status: "signed_out" };

/**
 * Resolves session without throwing on a normal “not signed in” outcome (401).
 * Other errors (e.g. data load failures) still propagate.
 */
export async function resolveServerSession(): Promise<ResolvedServerSession> {
  try {
    const userId = await getServerUserId();
    return { status: "authed", userId };
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) {
      return { status: "signed_out" };
    }
    throw error;
  }
}
