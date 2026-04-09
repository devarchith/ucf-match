import { db } from "@/lib/db";
import { type PreferencesInput } from "@/lib/validation/preferences";

export class PreferencesServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function submitPreferences(userId: string, input: PreferencesInput) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, isEmailVerified: true }
  });
  if (!user) {
    throw new PreferencesServiceError("User not found.", 404);
  }
  if (!user.isEmailVerified) {
    throw new PreferencesServiceError("Verified users only.", 403);
  }

  return db.preference.upsert({
    where: { userId },
    create: {
      userId,
      preferredGenders: input.preferredGenders,
      interests: input.interests,
      communicationStyle: input.communicationStyle
    },
    update: {
      preferredGenders: input.preferredGenders,
      interests: input.interests,
      communicationStyle: input.communicationStyle
    }
  });
}
