import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveServerSession } from "@/lib/auth/server-user";
import { presentDashboardLoadKind } from "@/lib/frontend/rsc-dev-bearer-failure";
import { presentRscThrownLoaderFailure } from "@/lib/frontend/rsc-loader-thrown-failure";
import { DashboardWeekLoadError } from "@/lib/dashboard/load-error";
import { getDashboardPageData } from "@/lib/dashboard/page-data";
import type { DashboardStatus } from "@/lib/mock/app-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await resolveServerSession();
  if (session.status === "signed_out") {
    return (
      <AppShell title="Dashboard" subtitle="Your weekly matching control center.">
        <TopNav pathname="/dashboard" />
        <SignedOutPrompt />
      </AppShell>
    );
  }

  try {
    const dashboardData = await getDashboardPageData();

    const statusLabel: Record<DashboardStatus, string> = {
      "awaiting-opt-in": "Awaiting weekly opt-in",
      "opted-in": "Opted in",
      matched: "Matched this cycle",
      paused: "Paused"
    };

    return (
      <AppShell title="Dashboard" subtitle="Your weekly matching control center.">
        <TopNav pathname="/dashboard" />
        <PageStateGate
          viewState="ready"
          loadingTitle="Loading your dashboard"
          emptyTitle="No dashboard data yet"
          emptyDescription="Save profile basics, questionnaire, and preferences to populate this checklist."
          errorDescription="We could not load your dashboard. Please try again."
          ready={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Setup checklist</CardTitle>
                  <CardDescription>
                    Tracked items reflect what we already have on file from the API, not a guarantee of
                    match readiness.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{dashboardData.completion}% on file</span>
                      <span className="text-muted-foreground">Checklist</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${dashboardData.completion}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {dashboardData.checklist.map((item) => (
                      <p key={item.id} className="text-sm">
                        {item.done ? "✓" : "○"} {item.label}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly participation</CardTitle>
                  <CardDescription>This cycle’s weekly opt-in status and scheduled reveal time.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="secondary">{statusLabel[dashboardData.status]}</Badge>
                  <p className="text-sm text-muted-foreground">
                    Next reveal timing: {dashboardData.nextMatchWindow}
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <p>{dashboardData.participation.optedIn ? "✓" : "○"} Weekly opt-in (this cycle)</p>
                    <p>
                      {dashboardData.participation.questionnaireOnFile ? "✓" : "○"} Questionnaire on file
                    </p>
                    <p>{dashboardData.participation.preferencesSet ? "✓" : "○"} Preferences on file</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Primary actions</CardTitle>
                  <CardDescription>
                    Suggested next steps from this week’s status and what we have on file — not a guarantee of
                    eligibility.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboardData.primaryActions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No required actions are listed for you right now based on this week’s status.
                    </p>
                  ) : (
                    dashboardData.primaryActions.map((action) => (
                      <Link
                        key={action.id}
                        href={action.href}
                        className={buttonVariants({
                          className: "w-full",
                          variant: action.priority === "primary" ? "default" : "outline"
                        })}
                      >
                        {action.label}
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          }
        />
      </AppShell>
    );
  } catch (error) {
    if (error instanceof DashboardWeekLoadError) {
      const v = presentDashboardLoadKind(error.kind, error.message);
      const description =
        error.kind === "response_contract" && process.env.NODE_ENV !== "production"
          ? `${v.description} (Dev: contract details are logged where the server fetch runs.)`
          : v.description;
      return (
        <AppShell title="Dashboard" subtitle="Your weekly matching control center.">
          <TopNav pathname="/dashboard" />
          <PageStateGate viewState="error" errorTitle={v.title} errorDescription={description} ready={null} />
        </AppShell>
      );
    }
    const v = presentRscThrownLoaderFailure(error);
    return (
      <AppShell title="Dashboard" subtitle="Your weekly matching control center.">
        <TopNav pathname="/dashboard" />
        <PageStateGate viewState="error" errorTitle={v.title} errorDescription={v.description} ready={null} />
      </AppShell>
    );
  }
}
