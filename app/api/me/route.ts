import { NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/route-errors";
import { requireAuthAsync } from "@/lib/auth";
import { getMeSnapshot } from "@/lib/me";

export async function GET(request: Request) {
  try {
    const auth = await requireAuthAsync(request);
    const me = await getMeSnapshot(auth.userId);
    return NextResponse.json(me, { status: 200 });
  } catch (error) {
    return toRouteErrorResponse(error, {
      route: "/api/me",
      method: "GET",
      requestId: request.headers.get("x-request-id")
    });
  }
}
