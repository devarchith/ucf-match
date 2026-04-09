import { NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/route-errors";
import { requireAuthAsync } from "@/lib/auth";
import { submitPreferences } from "@/lib/preferences";
import { preferencesInputSchema } from "@/lib/validation/preferences";

export async function PUT(request: Request) {
  try {
    const auth = await requireAuthAsync(request);
    const body = await request.json();
    const input = preferencesInputSchema.parse(body);
    const preferences = await submitPreferences(auth.userId, input);
    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    return toRouteErrorResponse(error, { route: "/api/preferences", method: "PUT", requestId: request.headers.get("x-request-id") });
  }
}
