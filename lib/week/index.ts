import { ParticipationStatus, WeekStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ucfEmailSchema } from "@/lib/validation";

export class WeekServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type EligibilityResult = {
  eligible: boolean;
  reason: string | null;
};

async function getActiveWeek() {
  const now = new Date();

  return db.week.findFirst({
    where: {
      status: WeekStatus.ACTIVE,
      startDate: { lte: now },
      endDate: { gte: now }
    },
    orderBy: { startDate: "desc" }
  });
}

async function getEligibility(userId: string): Promise<EligibilityResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      ucfEmail: true,
      isEmailVerified: true,
      profile: { select: { id: true } },
      questionnaire: { select: { id: true } },
      preference: { select: { id: true } }
    }
  });

  if (!user) {
    throw new WeekServiceError("User not found.", 404);
  }
  if (!user.isEmailVerified) {
    return { eligible: false, reason: "UCF email must be verified." };
  }
  if (!ucfEmailSchema.safeParse(user.ucfEmail).success) {
    return { eligible: false, reason: "UCF email required." };
  }
  if (!user.profile || !user.questionnaire || !user.preference) {
    return {
      eligible: false,
      reason: "Complete profile, questionnaire, and preferences first."
    };
  }

  return { eligible: true, reason: null };
}

export async function getCurrentWeekStatus(userId: string) {
  const [week, eligibility] = await Promise.all([
    getActiveWeek(),
    getEligibility(userId)
  ]);

  if (!week) {
    return {
      week: null,
      participation: null,
      canOptIn: false,
      reason: "No active week."
    };
  }

  const participation = await db.weeklyParticipation.findUnique({
    where: {
      userId_weekId: {
        userId,
        weekId: week.id
      }
    },
    select: {
      id: true,
      status: true,
      optedInAt: true,
      updatedAt: true
    }
  });

  return {
    week: {
      id: week.id,
      label: week.label,
      startDate: week.startDate,
      endDate: week.endDate,
      status: week.status
    },
    participation: participation ?? {
      id: null,
      status: ParticipationStatus.OPTED_OUT,
      optedInAt: null,
      updatedAt: null
    },
    canOptIn: eligibility.eligible,
    reason: eligibility.reason
  };
}

export async function optIntoActiveWeek(userId: string) {
  const [week, eligibility] = await Promise.all([
    getActiveWeek(),
    getEligibility(userId)
  ]);

  if (!week) {
    throw new WeekServiceError("No active week.", 409);
  }
  if (!eligibility.eligible) {
    throw new WeekServiceError(eligibility.reason ?? "Not eligible.", 403);
  }

  return db.weeklyParticipation.upsert({
    where: {
      userId_weekId: {
        userId,
        weekId: week.id
      }
    },
    create: {
      userId,
      weekId: week.id,
      status: ParticipationStatus.OPTED_IN,
      optedInAt: new Date()
    },
    update: {
      status: ParticipationStatus.OPTED_IN,
      optedInAt: new Date()
    },
    select: {
      id: true,
      userId: true,
      weekId: true,
      status: true,
      optedInAt: true,
      updatedAt: true
    }
  });
}
