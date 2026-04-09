import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthOperationalError } from "@/lib/auth";

type StatusError = {
  status: number;
  message: string;
};

type RouteErrorContext = {
  route?: string;
  method?: string;
  requestId?: string | null;
};

function isStatusError(value: unknown): value is StatusError {
  if (!value || typeof value !== "object") {
    return false;
  }
  const maybe = value as Partial<StatusError>;
  return typeof maybe.status === "number" && typeof maybe.message === "string";
}

export function toRouteErrorResponse(error: unknown, context?: RouteErrorContext) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request payload.", issues: error.issues },
      { status: 400 }
    );
  }
  if (error instanceof AuthOperationalError) {
    console.error(
      JSON.stringify({
        level: "error",
        type: "auth_operational_failure",
        code: error.code,
        message: error.message,
        status: error.status,
        route: context?.route ?? null,
        method: context?.method ?? null,
        requestId: context?.requestId ?? null
      })
    );
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }
  if (isStatusError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}
