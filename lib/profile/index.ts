import { db } from "@/lib/db";
import { ucfEmailSchema } from "@/lib/validation";
import { type ProfileInput } from "@/lib/validation/profile";

export class ProfileServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function getProfileForUser(userId: string) {
  return db.profile.findUnique({
    where: { userId },
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
  });
}

export async function createOrUpdateProfile(userId: string, input: ProfileInput) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, ucfEmail: true, isEmailVerified: true }
  });

  if (!user) {
    throw new ProfileServiceError("User not found.", 404);
  }
  if (!user.isEmailVerified) {
    throw new ProfileServiceError("UCF email must be verified.", 403);
  }
  if (!ucfEmailSchema.safeParse(user.ucfEmail).success) {
    throw new ProfileServiceError("UCF email required.", 403);
  }

  return db.profile.upsert({
    where: { userId },
    create: {
      userId,
      firstName: input.firstName,
      lastName: input.lastName,
      major: input.major,
      graduationYear: input.graduationYear,
      bio: input.bio
    },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      major: input.major,
      graduationYear: input.graduationYear,
      bio: input.bio
    }
  });
}
