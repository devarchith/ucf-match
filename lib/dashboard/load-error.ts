import type { DashboardDevBearerLoadKind } from "@/lib/dashboard/dev-bearer-load-kind";

/** Thrown when dashboard cannot load API-backed week or /api/me slice. */
export class DashboardWeekLoadError extends Error {
  override readonly name = "DashboardWeekLoadError";

  constructor(
    message: string,
    public readonly kind: DashboardDevBearerLoadKind
  ) {
    super(message);
  }

  /** @deprecated Use `kind === "auth_misconfigured"` */
  get misconfigured(): boolean {
    return this.kind === "auth_misconfigured";
  }
}
