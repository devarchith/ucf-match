import { z } from "zod";

export const ucfEmailSchema = z
  .string()
  .email()
  .regex(/@ucf\.edu$/i, "Must use a @ucf.edu email.");

export { profileInputSchema } from "@/lib/validation/profile";
export { questionnaireInputSchema } from "@/lib/validation/questionnaire";
export { preferencesInputSchema } from "@/lib/validation/preferences";
export { reportInputSchema } from "@/lib/validation/report";
export { blockInputSchema } from "@/lib/validation/block";
