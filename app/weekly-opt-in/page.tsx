import { ParticipationStatus } from "@prisma/client";

import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { resolveServerSession } from "@/lib/auth/server-user";
import { getCurrentWeekStatus } from "@/lib/week";

import { WeeklyOptInForm } from "./weekly-opt-in-form";

export const dynamic = "force-dynamic";

export default async function WeeklyOptInPage() {
  const session = await resolveServerSession();
  if (session.status === "signed_out") {
    return (
      <AppShell title="Weekly opt-in" subtitle="Confirm you want to be considered in this week’s batch.">
        <TopNav pathname="/weekly-opt-in" />
        <SignedOutPrompt />
      </AppShell>
    );
  }

  try {
    const status = await getCurrentWeekStatus(session.userId);
    const participationStatus = status.participation
      ? status.participation.status
      : ParticipationStatus.OPTED_OUT;

    return (
      <AppShell title="Weekly opt-in" subtitle="Confirm you want to be considered in this week’s batch.">
        <TopNav pathname="/weekly-opt-in" />
        <WeeklyOptInForm
          weekLabel={status.week?.label ?? null}
          noActiveWeek={!status.week}
          canOptIn={status.canOptIn}
          eligibilityReason={status.reason}
          participationStatus={participationStatus}
        />
      </AppShell>
    );
  } catch {
    return (
      <AppShell title="Weekly opt-in" subtitle="Confirm you want to be considered in this week’s batch.">
        <TopNav pathname="/weekly-opt-in" />
        <PageStateGate
          viewState="error"
          errorDescription="We could not load weekly status. Please try again."
          ready={null}
        />
      </AppShell>
    );
  }
}
