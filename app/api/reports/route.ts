import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getRequestAuthContext } from "@/lib/auth";
import { createReport, SafetyServiceError } from "@/lib/safety";
import { reportInputSchema } from "@/lib/validation/report";

export async function POST(request: Request) {
  try {
    const auth = getRequestAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = reportInputSchema.parse(body);
    const report = await createReport(auth.userId, input);
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload.", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof SafetyServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
