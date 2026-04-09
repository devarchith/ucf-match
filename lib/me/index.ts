import { db } from "@/lib/db";

export class MeServiceError extends Error {
  status: number;

  constructor(message: string, status = 404) {
    super(message);
    this.status = status;
  }
}

/** Single read for dashboard wiring: identity, profile row (or null), onboarding flags. */
export async function getMeSnapshot(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      ucfEmail: true,
      isEmailVerified: true,
      profile: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          major: true,
          graduationYear: true,
          bio: true,
          createdAt: true,
          updatedAt: true
        }
      },
      questionnaire: { select: { id: true } },
      preference: { select: { id: true } }
    }
  });

  if (!user) {
    throw new MeServiceError("User not found.", 404);
  }

  return {
    userId: user.id,
    ucfEmail: user.ucfEmail,
    isEmailVerified: user.isEmailVerified,
    profile: user.profile,
    hasQuestionnaire: user.questionnaire !== null,
    hasPreferences: user.preference !== null
  };
}
