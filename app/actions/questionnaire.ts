"use server";

import { ZodError } from "zod";
import { checkServerActionApiIdentity } from "@/lib/api/assert-action-identity";
import { devBearerApiJson } from "@/lib/api/authenticated-server-client";
import { AuthError } from "@/lib/auth";
import {
  questionnaireSubmitWireSchema,
  type QuestionnaireSubmitWire
} from "@/lib/api/contracts/questionnaire";
import {
  mapDevBearerFailure,
  unexpectedMappedActionFailure,
  type MappedActionFailure
} from "@/lib/api/map-dev-bearer-to-action";
import { SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import { getServerUserId } from "@/lib/auth/server-user";
import { questionnaireInputSchema } from "@/lib/validation/questionnaire";
import { serializeZodIssues } from "@/lib/validation/zod-issues";

export type QuestionnaireActionResult =
  | { ok: true; data: QuestionnaireSubmitWire }
  | MappedActionFailure;

export async function submitQuestionnaireAction(payload: unknown): Promise<QuestionnaireActionResult> {
  let userId: string;
  try {
    userId = await getServerUserId();
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        code: SERVER_ACTION_UNAUTHORIZED,
        message: "You are not signed in."
      };
    }
    return unexpectedMappedActionFailure(error);
  }

  const identityFailure = await checkServerActionApiIdentity(userId);
  if (identityFailure) {
    return identityFailure;
  }

  let input;
  try {
    input = questionnaireInputSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid questionnaire data.",
        issues
      };
    }
    return unexpectedMappedActionFailure(error);
  }

  const result = await devBearerApiJson(
    "/api/questionnaire",
    { method: "POST", body: JSON.stringify(input) },
    questionnaireSubmitWireSchema
  );

  if (!result.ok) {
    return mapDevBearerFailure(result);
  }

  return { ok: true, data: result.data };
}
