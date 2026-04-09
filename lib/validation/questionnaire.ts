import { z } from "zod";

export type JsonCompatible =
  | string
  | number
  | boolean
  | null
  | JsonCompatible[]
  | { [key: string]: JsonCompatible };

export function isJsonCompatible(value: unknown): value is JsonCompatible {
  if (value === null) {
    return true;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJsonCompatible(item));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every((item) =>
      isJsonCompatible(item)
    );
  }
  return false;
}

function hasMeaningfulJsonValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulJsonValue(item));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) =>
      hasMeaningfulJsonValue(item)
    );
  }
  return false;
}

export function hasMeaningfulQuestionnaireAnswers(
  answers: Record<string, unknown>
): boolean {
  if (Object.keys(answers).length === 0) {
    return false;
  }
  return Object.values(answers).some((value) => hasMeaningfulJsonValue(value));
}

export const questionnaireInputSchema = z.object({
  answers: z
    .record(z.string(), z.unknown())
    .refine((answers) => Object.keys(answers).length > 0, "At least one answer is required.")
    .refine(
      (answers) => hasMeaningfulQuestionnaireAnswers(answers),
      "At least one meaningful answer is required."
    )
    .refine((answers) => isJsonCompatible(answers), "Answers must be JSON-compatible.")
});

export type QuestionnaireInput = z.infer<typeof questionnaireInputSchema>;
