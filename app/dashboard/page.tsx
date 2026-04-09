import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveServerSession } from "@/lib/auth/server-user";
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
    const dashboardData = await getDashboardPageData(session.userId);

    const statusLabel: Record<DashboardStatus, string> = {
      "awaiting-opt-in": "Awaiting weekly opt-in",
      "opted-in": "Opted in",
      matched: "Match ready",
      paused: "Paused"
    };

    return (
      <AppShell title="Dashboard" subtitle="Your weekly matching control center.">
        <TopNav pathname="/dashboard" />
        <PageStateGate
          viewState="ready"
          loadingTitle="Loading your dashboard"
          emptyTitle="No dashboard data yet"
          emptyDescription="Complete onboarding and weekly setup to populate your dashboard."
          errorDescription="We could not load your dashboard. Please try again."
          ready={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Profile completion</CardTitle>
                  <CardDescription>Complete profile context improves weekly match quality.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{dashboardData.completion}% complete</span>
                      <span className="text-muted-foreground">Profile</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${dashboardData.completion}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    {dashboardData.checklist.map((item) => (
                      <p key={item.label} className="text-sm">
                        {item.done ? "✓" : "○"} {item.label}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly participation</CardTitle>
                  <CardDescription>Current cycle readiness and reveal timing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="secondary">{statusLabel[dashboardData.status]}</Badge>
                  <p className="text-sm text-muted-foreground">
                    Next reveal timing: {dashboardData.nextMatchWindow}
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <p>{dashboardData.participation.optedIn ? "✓" : "○"} Weekly opt-in complete</p>
                    <p>{dashboardData.participation.questionnaireComplete ? "✓" : "○"} Questionnaire complete</p>
                    <p>{dashboardData.participation.preferencesSet ? "✓" : "○"} Preferences set</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Primary actions</CardTitle>
                  <CardDescription>Take these steps to stay eligible this week.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dashboardData.primaryActions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">You are set for this week.</p>
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
  } catch {
    return (
      <AppShell title="Dashboard" subtitle="Your weekly matching control center.">
        <TopNav pathname="/dashboard" />
        <PageStateGate
          viewState="error"
          errorDescription="We could not load your dashboard. Please try again."
          ready={null}
        />
      </AppShell>
    );
  }
}
