import Image from "next/image";

import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { ResponsiveActionRow } from "@/components/responsive-action-row";
import { ReportBlockActions } from "@/components/report-block-actions";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { matchPreview } from "@/lib/mock/app-data";
import { matchViewState } from "@/lib/mock/page-state";

export default function MatchRevealPage() {
  return (
    <AppShell title="Match reveal" subtitle="When the cycle completes, your intro appears here.">
      <TopNav pathname="/match" />
      <PageStateGate
        viewState={matchViewState}
        loadingTitle="Preparing your match reveal"
        emptyTitle="No reveal available"
        emptyDescription="If no compatible match is available, you will roll into next cycle."
        errorDescription="We could not load your reveal. Please try again soon."
        ready={
          <Card>
            <CardHeader>
              <CardTitle>
                {matchPreview.firstName}, {matchPreview.age}
              </CardTitle>
              <CardDescription>
                {matchPreview.year} • {matchPreview.major}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Image
                src={matchPreview.photoUrl}
                alt={`${matchPreview.firstName} profile`}
                width={480}
                height={320}
                className="h-52 w-full rounded-lg border object-cover"
              />
              <p className="text-sm text-muted-foreground">{matchPreview.shortBio}</p>

              <div className="flex flex-wrap gap-2">
                {matchPreview.sharedInterests.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">Why this may be a strong fit</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {matchPreview.compatibilityReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>

              <p className="text-sm">
                <span className="font-medium">Suggested opener:</span> {matchPreview.introPrompt}
              </p>
              <p className="text-xs text-muted-foreground">{matchPreview.safetyNote}</p>
              <ResponsiveActionRow>
                <Button>Accept intro</Button>
                <Button variant="outline">Pass this week</Button>
              </ResponsiveActionRow>
              <ReportBlockActions source="match" />
            </CardContent>
          </Card>
        }
      />
    </AppShell>
  );
}
