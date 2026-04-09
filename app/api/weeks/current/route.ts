import { NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/route-errors";
import { requireAuthAsync } from "@/lib/auth";
import { getCurrentWeekStatus } from "@/lib/week";

export async function GET(request: Request) {
  try {
    const auth = await requireAuthAsync(request);
    const result = await getCurrentWeekStatus(auth.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toRouteErrorResponse(error, { route: "/api/weeks/current", method: "GET", requestId: request.headers.get("x-request-id") });
  }
}
