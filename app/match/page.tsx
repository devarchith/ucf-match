import Image from "next/image";

import { ParticipationStatus } from "@prisma/client";

import { AppShell } from "@/components/app-shell";
import { MatchResponseActions } from "@/components/match-response-actions";
import { PageStateGate } from "@/components/page-state-gate";
import { ReportBlockActions } from "@/components/report-block-actions";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { loadWeekPageContext } from "@/lib/api/rsc-auth-context";
import { resolveServerSession } from "@/lib/auth/server-user";
import { PROFILE_PHOTO_PLACEHOLDER_URL } from "@/lib/constants/profile-placeholder";

export const dynamic = "force-dynamic";

export default async function MatchRevealPage() {
  const session = await resolveServerSession();
  if (session.status === "signed_out") {
    return (
      <AppShell title="Match reveal" subtitle="When the cycle completes, your intro appears here.">
        <TopNav pathname="/match" />
        <SignedOutPrompt />
      </AppShell>
    );
  }

  const ctx = await loadWeekPageContext(session.userId);
  if (!ctx.ok) {
    return (
      <AppShell title="Match reveal" subtitle="When the cycle completes, your intro appears here.">
        <TopNav pathname="/match" />
        <PageStateGate
          viewState="error"
          errorTitle={ctx.failure.title}
          errorDescription={ctx.failure.description}
          ready={null}
        />
      </AppShell>
    );
  }

  const weekStatus = ctx.week;
  const preview = weekStatus.activeMatch;
  const viewState = preview ? "ready" : "empty";
  const participationStatus = weekStatus.participation?.status ?? ParticipationStatus.OPTED_OUT;
  const matchedWithoutPreview = !preview && participationStatus === ParticipationStatus.MATCHED;

  const emptyTitle = matchedWithoutPreview ? "Reveal unavailable" : "No reveal available";
  const emptyDescription = matchedWithoutPreview
    ? "We could not load this match’s profile preview yet. Try again soon."
    : "If no compatible match is available, you will roll into next cycle.";

  const subtitleParts: string[] = [];
  if (preview?.graduationYear != null) {
    subtitleParts.push(`Class of ${preview.graduationYear}`);
  }
  const majorTrimmed = preview?.major?.trim();
  if (majorTrimmed) {
    subtitleParts.push(majorTrimmed);
  }
  const cardSubtitle = subtitleParts.length > 0 ? subtitleParts.join(" • ") : "—";

  return (
    <AppShell title="Match reveal" subtitle="When the cycle completes, your intro appears here.">
      <TopNav pathname="/match" />
      <PageStateGate
        viewState={viewState}
        loadingTitle="Preparing your match reveal"
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        errorDescription="We could not load your reveal. Please try again soon."
        ready={
          preview ? (
            <Card>
              <CardHeader>
                <CardTitle>{preview.firstName}</CardTitle>
                <CardDescription>{cardSubtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Image
                  src={PROFILE_PHOTO_PLACEHOLDER_URL}
                  alt={`${preview.firstName} profile`}
                  width={480}
                  height={320}
                  unoptimized
                  className="h-52 w-full rounded-lg border object-cover"
                />
                {preview.bio?.trim() ? (
                  <p className="text-sm text-muted-foreground">{preview.bio.trim()}</p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {preview.sharedInterests.length === 0 ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : (
                    preview.sharedInterests.map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))
                  )}
                </div>

                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">Why this may be a strong fit</p>
                  {preview.compatibilityReasons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">—</p>
                  ) : (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {preview.compatibilityReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <MatchResponseActions matchId={preview.matchId} />
                <ReportBlockActions
                  source="match"
                  otherUserId={preview.otherUserId}
                  matchId={preview.matchId}
                />
              </CardContent>
            </Card>
          ) : null
        }
      />
    </AppShell>
  );
}
