import { db } from "@/lib/db";
import { type QuestionnaireInput, type JsonCompatible } from "@/lib/validation/questionnaire";

export class QuestionnaireServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function submitQuestionnaire(
  userId: string,
  input: QuestionnaireInput
) {
  const answers: JsonCompatible = input.answers;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isEmailVerified: true }
  });
  if (!user) {
    throw new QuestionnaireServiceError("User not found.", 404);
  }
  if (!user.isEmailVerified) {
    throw new QuestionnaireServiceError("Verified users only.", 403);
  }

  return db.questionnaireResponse.upsert({
    where: { userId },
    create: {
      userId,
      answers
    },
    update: {
      answers
    }
  });
}
