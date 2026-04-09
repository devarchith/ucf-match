import { Prisma, ParticipationStatus, WeekStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ucfEmailSchema } from "@/lib/validation";
import { hasMeaningfulQuestionnaireAnswers } from "@/lib/validation/questionnaire";

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

export type ParticipationLifecycleActor =
  | "user_opt_in"
  | "matching_rerun"
  | "matching_assign";

export function assertParticipationTransition(
  from: ParticipationStatus,
  to: ParticipationStatus,
  actor: ParticipationLifecycleActor
) {
  if (from === to) {
    return;
  }
  if (actor === "user_opt_in" && from === ParticipationStatus.MATCHED && to === ParticipationStatus.OPTED_IN) {
    throw new WeekServiceError(
      "Cannot opt in after being matched for the active week.",
      409
    );
  }
  if (actor === "matching_rerun" && from === ParticipationStatus.MATCHED && to === ParticipationStatus.OPTED_IN) {
    return;
  }
  if (actor === "matching_assign" && from === ParticipationStatus.OPTED_IN && to === ParticipationStatus.MATCHED) {
    return;
  }
  if (actor === "user_opt_in" && from === ParticipationStatus.OPTED_OUT && to === ParticipationStatus.OPTED_IN) {
    return;
  }
  throw new WeekServiceError(
    `Invalid weekly participation transition: ${from} -> ${to} (${actor}).`,
    409
  );
}

function hasMeaningfulText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasMeaningfulQuestionnaire(answers: unknown) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return false;
  }
  return hasMeaningfulQuestionnaireAnswers(answers as Record<string, unknown>);
}

export function assertCanOptInTransition(currentStatus: ParticipationStatus | null) {
  if (currentStatus === ParticipationStatus.MATCHED) {
    assertParticipationTransition(
      ParticipationStatus.MATCHED,
      ParticipationStatus.OPTED_IN,
      "user_opt_in"
    );
  }
}

/**
 * Allowed transitions via opt-in endpoint:
 * - OPTED_OUT -> OPTED_IN
 * - OPTED_IN -> OPTED_IN (idempotent refresh)
 * Forbidden:
 * - MATCHED -> OPTED_IN
 */

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
      profile: { select: { id: true, firstName: true, lastName: true } },
      questionnaire: { select: { id: true, answers: true } },
      preference: { select: { id: true, preferredGenders: true, interests: true } }
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
  if (!user.profile || !hasMeaningfulText(user.profile.firstName) || !hasMeaningfulText(user.profile.lastName)) {
    return {
      eligible: false,
      reason: "Complete profile with first and last name first."
    };
  }
  if (!user.questionnaire || !hasMeaningfulQuestionnaire(user.questionnaire.answers)) {
    return {
      eligible: false,
      reason: "Complete questionnaire with at least one answer first."
    };
  }
  if (
    !user.preference ||
    user.preference.preferredGenders.length === 0 ||
    user.preference.interests.length === 0
  ) {
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

  const now = new Date();
  const MAX_WRITE_ATTEMPTS = 2;
  return db.$transaction(async (tx) => {
    for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
      const participationRow = await tx.weeklyParticipation.findUnique({
        where: {
          userId_weekId: {
            userId,
            weekId: week.id
          }
        },
        select: { id: true, status: true }
      });

      if (!participationRow) {
        try {
          await tx.weeklyParticipation.create({
            data: {
              userId,
              weekId: week.id,
              status: ParticipationStatus.OPTED_IN,
              optedInAt: now
            }
          });
          break;
        } catch (error: unknown) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002" &&
            attempt < MAX_WRITE_ATTEMPTS - 1
          ) {
            continue;
          }
          throw error;
        }
      }

      if (participationRow.status === ParticipationStatus.MATCHED) {
        assertCanOptInTransition(ParticipationStatus.MATCHED);
      }

      assertParticipationTransition(
        participationRow.status,
        ParticipationStatus.OPTED_IN,
        "user_opt_in"
      );
      // Compare-and-swap row write: only update if status is unchanged since read.
      const writeResult = await tx.weeklyParticipation.updateMany({
        where: { id: participationRow.id, status: participationRow.status },
        data: { status: ParticipationStatus.OPTED_IN, optedInAt: now }
      });
      if (writeResult.count === 1) {
        break;
      }

      if (attempt === MAX_WRITE_ATTEMPTS - 1) {
        throw new WeekServiceError("Participation status changed during opt-in. Please retry.", 409);
      }
    }

    return tx.weeklyParticipation.findUniqueOrThrow({
      where: {
        userId_weekId: {
          userId,
          weekId: week.id
        }
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
  });
}
