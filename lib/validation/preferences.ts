import { z } from "zod";

const canonicalPreferencesSchema = z.object({
  preferredGenders: z.array(z.string().trim().min(1).max(40)).min(1).max(10),
  interests: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  communicationStyle: z.string().trim().min(1).max(120).optional()
});

const comfortPreferencesSchema = z
  .object({
    campusAreaDistance: z.enum(["low", "medium", "high"]),
    conversationPace: z.enum(["low", "medium", "high"]),
    meetingWindows: z.enum(["low", "medium", "high"]),
    communicationStyle: z.string().trim().min(1).max(120).optional()
  })
  .transform(
    (data): z.infer<typeof canonicalPreferencesSchema> => ({
      preferredGenders: ["any"],
      interests: [
        `campus-area:${data.campusAreaDistance}`,
        `conversation-pace:${data.conversationPace}`,
        `meeting-windows:${data.meetingWindows}`
      ],
      communicationStyle: data.communicationStyle
    })
  );

/** Canonical body or UI comfort sliders (mapped to stored tags + `preferredGenders: ["any"]`). */
export const preferencesInputSchema = z.union([canonicalPreferencesSchema, comfortPreferencesSchema]);

export type PreferencesInput = z.infer<typeof canonicalPreferencesSchema>;
