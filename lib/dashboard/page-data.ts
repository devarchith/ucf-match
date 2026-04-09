import "server-only";

import { ParticipationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentWeekStatus } from "@/lib/week";
import type { DashboardAction, DashboardData, DashboardStatus } from "@/lib/mock/app-data";
import { hasMeaningfulQuestionnaireAnswers } from "@/lib/validation/questionnaire";

export async function getDashboardPageData(userId: string): Promise<DashboardData> {
  const [weekStatus, user] = await Promise.all([
    getCurrentWeekStatus(userId),
    db.user.findUnique({
      where: { id: userId },
      select: {
        isEmailVerified: true,
        profile: {
          select: { firstName: true, lastName: true, major: true, bio: true }
        },
        questionnaire: { select: { answers: true } },
        preference: {
          select: { preferredGenders: true, interests: true }
        }
      }
    })
  ]);

  if (!user) {
    throw new Error("User not found.");
  }

  const emailDone = user.isEmailVerified;
  const profileDone = Boolean(
    user.profile?.firstName?.trim() && user.profile?.lastName?.trim()
  );
  const questionnaireDone = Boolean(
    user.questionnaire?.answers &&
      hasMeaningfulQuestionnaireAnswers(user.questionnaire.answers as Record<string, unknown>)
  );
  const preferencesDone = Boolean(
    user.preference &&
      user.preference.preferredGenders.length > 0 &&
      user.preference.interests.length > 0
  );

  const checklist: DashboardData["checklist"] = [
    { label: "Verify UCF email", done: emailDone },
    { label: "Finish profile basics", done: profileDone },
    { label: "Complete weekly questionnaire", done: questionnaireDone },
    { label: "Set weekly preferences", done: preferencesDone }
  ];

  const doneCount = checklist.filter((item) => item.done).length;
  const completion = Math.round((doneCount / checklist.length) * 100);

  let status: DashboardStatus;
  if (!weekStatus.week) {
    status = "paused";
  } else if (!weekStatus.participation) {
    status = "awaiting-opt-in";
  } else if (weekStatus.participation.status === ParticipationStatus.MATCHED) {
    status = "matched";
  } else if (weekStatus.participation.status === ParticipationStatus.OPTED_IN) {
    status = "opted-in";
  } else {
    status = "awaiting-opt-in";
  }

  const nextMatchWindow = weekStatus.week
    ? weekStatus.week.endDate.toLocaleString(undefined, {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
      })
    : "—";

  const optedInForCard =
    weekStatus.participation != null &&
    (weekStatus.participation.status === ParticipationStatus.OPTED_IN ||
      weekStatus.participation.status === ParticipationStatus.MATCHED);

  const primaryActions: DashboardAction[] = [];

  if (
    weekStatus.week &&
    weekStatus.participation &&
    weekStatus.participation.status === ParticipationStatus.OPTED_OUT &&
    weekStatus.canOptIn
  ) {
    primaryActions.push({
      id: "opt-in",
      label: "Complete weekly opt-in",
      href: "/weekly-opt-in",
      priority: "primary"
    });
  }

  if (!questionnaireDone) {
    primaryActions.push({
      id: "questionnaire",
      label: "Finish questionnaire",
      href: "/questionnaire",
      priority: primaryActions.some((a) => a.priority === "primary") ? "secondary" : "primary"
    });
  }

  if (!preferencesDone) {
    primaryActions.push({
      id: "preferences",
      label: "Review preferences",
      href: "/preferences",
      priority: "secondary"
    });
  }

  if (!profileDone) {
    primaryActions.push({
      id: "profile",
      label: "Finish profile basics",
      href: "/onboarding",
      priority: primaryActions.length === 0 ? "primary" : "secondary"
    });
  }

  if (status === "matched" && !primaryActions.some((a) => a.href === "/match")) {
    primaryActions.push({
      id: "match-reveal",
      label: "View match reveal",
      href: "/match",
      priority: primaryActions.some((a) => a.priority === "primary") ? "secondary" : "primary"
    });
  }

  return {
    status,
    nextMatchWindow,
    completion,
    participation: {
      optedIn: optedInForCard,
      questionnaireComplete: questionnaireDone,
      preferencesSet: preferencesDone
    },
    checklist,
    primaryActions
  };
}
