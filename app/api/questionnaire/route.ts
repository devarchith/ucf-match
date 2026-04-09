import { NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/route-errors";
import { requireAuthAsync } from "@/lib/auth";
import { submitQuestionnaire } from "@/lib/questionnaire";
import { questionnaireInputSchema } from "@/lib/validation/questionnaire";

export async function POST(request: Request) {
  try {
    const auth = await requireAuthAsync(request);
    const body = await request.json();
    const input = questionnaireInputSchema.parse(body);
    const response = await submitQuestionnaire(auth.userId, input);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return toRouteErrorResponse(error, { route: "/api/questionnaire", method: "POST", requestId: request.headers.get("x-request-id") });
  }
}
