import { z } from "zod";

export const ucfEmailSchema = z
  .string()
  .email()
  .regex(/@ucf\.edu$/i, "Must use a @ucf.edu email.");
