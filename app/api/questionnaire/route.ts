import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getRequestAuthContext } from "@/lib/auth";
import {
  submitQuestionnaire,
  QuestionnaireServiceError
} from "@/lib/questionnaire";
import { questionnaireInputSchema } from "@/lib/validation/questionnaire";

export async function POST(request: Request) {
  try {
    const auth = getRequestAuthContext(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = questionnaireInputSchema.parse(body);
    const response = await submitQuestionnaire(auth.userId, input);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload.", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof QuestionnaireServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
