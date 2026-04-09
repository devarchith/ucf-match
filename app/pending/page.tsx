import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pendingViewState } from "@/lib/mock/page-state";

export default function PendingPage() {
  return (
    <AppShell title="Pending match run" subtitle="You are in this week’s queue.">
      <TopNav />
      <PageStateGate
        viewState={pendingViewState}
        loadingTitle="Matching in progress"
        emptyTitle="No pending cycle"
        emptyDescription="When you opt in to a cycle, your pending status appears here."
        errorDescription="Pending status could not load. Please check again."
        ready={
          <Card>
            <CardHeader>
              <CardTitle>Countdown</CardTitle>
              <CardDescription>Estimated reveal: Thursday 8:00 PM ET</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold tracking-tight">1d 06h 14m</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This is static placeholder text until scheduling + status contracts are live.
              </p>
            </CardContent>
          </Card>
        }
      />
    </AppShell>
  );
}
