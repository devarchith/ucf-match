import { NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/route-errors";
import { requireAuthAsync } from "@/lib/auth";
import { submitWeeklyMatchResponse } from "@/lib/matches";
import { weeklyMatchResponseBodySchema } from "@/lib/validation/match-response";

type RouteContext = { params: Promise<{ matchId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthAsync(request);
    const { matchId } = await context.params;
    const trimmedId = matchId?.trim() ?? "";
    if (!trimmedId) {
      return NextResponse.json({ error: "Match id is required." }, { status: 400 });
    }
    const body = await request.json();
    const input = weeklyMatchResponseBodySchema.parse(body);
    const match = await submitWeeklyMatchResponse(auth.userId, trimmedId, input.response);
    return NextResponse.json(match, { status: 200 });
  } catch (error) {
    return toRouteErrorResponse(error, {
      route: "/api/matches/[matchId]/response",
      method: "POST",
      requestId: request.headers.get("x-request-id")
    });
  }
}
