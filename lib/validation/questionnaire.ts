import { z } from "zod";

export const questionnaireInputSchema = z.object({
  answers: z.record(z.string(), z.unknown())
});

export type QuestionnaireInput = z.infer<typeof questionnaireInputSchema>;
