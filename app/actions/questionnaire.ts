"use server";

import { ZodError } from "zod";
import { getServerUserId } from "@/lib/auth/server-user";
import { QuestionnaireServiceError, submitQuestionnaire } from "@/lib/questionnaire";
import { questionnaireInputSchema } from "@/lib/validation/questionnaire";
import { type SerializedZodIssue, serializeZodIssues } from "@/lib/validation/zod-issues";

export type QuestionnaireActionResult =
  | { ok: true; data: Awaited<ReturnType<typeof submitQuestionnaire>> }
  | { ok: false; message: string; issues?: SerializedZodIssue[] };

export async function submitQuestionnaireAction(payload: unknown): Promise<QuestionnaireActionResult> {
  try {
    const userId = await getServerUserId();
    const input = questionnaireInputSchema.parse(payload);
    const data = await submitQuestionnaire(userId, input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid questionnaire data.",
        issues
      };
    }
    if (error instanceof QuestionnaireServiceError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Could not save questionnaire. Try again." };
  }
}
