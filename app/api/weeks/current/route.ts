import { NextResponse } from "next/server";
import { getRequestAuthContext } from "@/lib/auth";
import { getCurrentWeekStatus, WeekServiceError } from "@/lib/week";

export async function GET(request: Request) {
  try {
    const auth = getRequestAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getCurrentWeekStatus(auth.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof WeekServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
