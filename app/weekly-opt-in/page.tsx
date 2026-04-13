import { ParticipationStatus } from "@prisma/client";

import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { loadWeekPageContext } from "@/lib/api/rsc-auth-context";
import { resolveServerSession } from "@/lib/auth/server-user";

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

  const ctx = await loadWeekPageContext(session.userId);
  if (!ctx.ok) {
    return (
      <AppShell title="Weekly opt-in" subtitle="Confirm you want to be considered in this week’s batch.">
        <TopNav pathname="/weekly-opt-in" />
        <PageStateGate
          viewState="error"
          errorTitle={ctx.failure.title}
          errorDescription={ctx.failure.description}
          ready={null}
        />
      </AppShell>
    );
  }

  const status = ctx.week;
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
}
