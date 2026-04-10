import { z } from "zod";

/** POST /api/questionnaire success body per docs/api-contracts.md. */
export const questionnaireSubmitWireSchema = z.object({
  id: z.string(),
  userId: z.string(),
  answers: z.record(z.string(), z.unknown()),
  submittedAt: z.string(),
  updatedAt: z.string()
});

export type QuestionnaireSubmitWire = z.infer<typeof questionnaireSubmitWireSchema>;
