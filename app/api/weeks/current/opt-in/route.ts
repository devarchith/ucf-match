import { NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/route-errors";
import { requireAuthAsync } from "@/lib/auth";
import { optIntoActiveWeek } from "@/lib/week";

export async function PUT(request: Request) {
  try {
    const auth = await requireAuthAsync(request);
    const participation = await optIntoActiveWeek(auth.userId);
    return NextResponse.json(participation, { status: 200 });
  } catch (error) {
    return toRouteErrorResponse(error, { route: "/api/weeks/current/opt-in", method: "PUT", requestId: request.headers.get("x-request-id") });
  }
}
