"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { ResponsiveActionRow } from "@/components/responsive-action-row";
import { TopNav } from "@/components/top-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { blockViewState } from "@/lib/mock/page-state";
import { normalizeEntryPoint } from "@/lib/mock/safety";

export default function BlockPage() {
  const searchParams = useSearchParams();
  const source = normalizeEntryPoint(searchParams.get("from") ?? undefined);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <AppShell title="Block user" subtitle="Block removes this person from your weekly experience.">
      <TopNav />
      <PageStateGate
        viewState={blockViewState}
        loadingTitle="Opening block confirmation"
        emptyTitle="No user selected"
        emptyDescription="There is no active interaction to block."
        errorDescription="We could not load block confirmation."
        ready={
          <Card>
            <CardHeader>
              <CardTitle>Confirm block</CardTitle>
              <CardDescription>
                You will no longer receive messages or match interactions from this person.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If there was harmful behavior, submit a report as well so we can take appropriate action.
              </p>
              <p className="text-xs text-muted-foreground">Started from: {source}</p>
              <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I understand this will immediately block future messages and match interactions with this person.
              </label>
              <ResponsiveActionRow>
                <Button variant="destructive" disabled={!confirmed}>
                  Confirm block
                </Button>
                <Link
                  href={source === "conversation" ? "/conversation" : "/match"}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Cancel
                </Link>
              </ResponsiveActionRow>
              {!confirmed ? (
                <p className="text-xs text-muted-foreground">
                  Check the confirmation box to enable blocking.
                </p>
              ) : null}
              <Link
                href={`/report?from=${source}`}
                className={buttonVariants({ variant: "ghost", className: "w-full" })}
              >
                Report instead
              </Link>
            </CardContent>
          </Card>
        }
      />
    </AppShell>
  );
}
