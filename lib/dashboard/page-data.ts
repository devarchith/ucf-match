import "server-only";

import { ParticipationStatus, WeekStatus } from "@prisma/client";
import { fetchCurrentWeekFromApi } from "@/lib/api/current-week-api";
import { loadAndAssertApiIdentity } from "@/lib/api/load-and-assert-api-identity";
import { getServerUserId } from "@/lib/auth/server-user";
import { dashboardKindFromDevBearerFailure } from "@/lib/dashboard/dev-bearer-load-kind";
import { dashboardKindFromRscFailureClass } from "@/lib/dashboard/rsc-failure-class-to-dashboard-kind";
import { DashboardWeekLoadError } from "@/lib/dashboard/load-error";
import type { DashboardAction, DashboardData, DashboardStatus } from "@/lib/mock/app-data";

export async function getDashboardPageData(): Promise<DashboardData> {
  const sessionUserId = await getServerUserId();
  const [weekRes, identityGate] = await Promise.all([
    fetchCurrentWeekFromApi(),
    loadAndAssertApiIdentity(sessionUserId)
  ]);

  if (!identityGate.ok) {
    const { failureClass, description } = identityGate.failure;
    throw new DashboardWeekLoadError(description, dashboardKindFromRscFailureClass(failureClass));
  }

  if (!weekRes.ok) {
    throw new DashboardWeekLoadError(weekRes.message, dashboardKindFromDevBearerFailure(weekRes));
  }

  const wire = weekRes.data;
  const me = identityGate.me;

  const weekStatus = {
    week: wire.week
      ? {
          id: wire.week.id,
          label: wire.week.label,
          startDate: new Date(wire.week.startDate),
          endDate: new Date(wire.week.endDate),
          status: wire.week.status as WeekStatus
        }
      : null,
    participation: wire.participation,
    canOptIn: wire.canOptIn,
    reason: wire.reason
  };

  const emailDone = me.isEmailVerified;
  const profileOnFile = Boolean(
    me.profile?.firstName?.trim() && me.profile?.lastName?.trim()
  );
  const questionnaireOnFile = me.hasQuestionnaire;
  const preferencesOnFile = me.hasPreferences;

  const checklist: DashboardData["checklist"] = [
    {
      id: "email",
      label: emailDone ? "UCF email verified" : "Verify UCF email",
      done: emailDone
    },
    {
      id: "profile",
      label: profileOnFile ? "Profile basics on file" : "Add profile basics",
      done: profileOnFile
    },
    {
      id: "questionnaire",
      label: questionnaireOnFile ? "Weekly questionnaire on file" : "Save a weekly questionnaire",
      done: questionnaireOnFile
    },
    {
      id: "preferences",
      label: preferencesOnFile ? "Preferences on file" : "Save preferences",
      done: preferencesOnFile
    }
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
      label: "Weekly opt-in",
      href: "/weekly-opt-in",
      priority: "primary"
    });
  }

  if (!questionnaireOnFile) {
    primaryActions.push({
      id: "questionnaire",
      label: "Weekly questionnaire",
      href: "/questionnaire",
      priority: primaryActions.some((a) => a.priority === "primary") ? "secondary" : "primary"
    });
  }

  if (!preferencesOnFile) {
    primaryActions.push({
      id: "preferences",
      label: "Preferences",
      href: "/preferences",
      priority: "secondary"
    });
  }

  if (!profileOnFile) {
    primaryActions.push({
      id: "profile",
      label: "Profile basics",
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
      questionnaireOnFile,
      preferencesSet: preferencesOnFile
    },
    checklist,
    primaryActions
  };
}
