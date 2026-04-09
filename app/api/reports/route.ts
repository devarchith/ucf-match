import { NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/route-errors";
import { requireAuthAsync } from "@/lib/auth";
import { createReport } from "@/lib/safety";
import { reportInputSchema } from "@/lib/validation/report";

export async function POST(request: Request) {
  try {
    const auth = await requireAuthAsync(request);
    const body = await request.json();
    const input = reportInputSchema.parse(body);
    const report = await createReport(auth.userId, input);
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return toRouteErrorResponse(error, { route: "/api/reports", method: "POST", requestId: request.headers.get("x-request-id") });
  }
}
