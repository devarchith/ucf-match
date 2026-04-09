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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reportViewState } from "@/lib/mock/page-state";
import { normalizeEntryPoint, reportReasons } from "@/lib/mock/safety";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const source = normalizeEntryPoint(searchParams.get("from") ?? undefined);
  const [selectedReason, setSelectedReason] = useState("");

  return (
    <AppShell title="Report user" subtitle="Use this form if a conversation or match felt unsafe.">
      <TopNav />
      <PageStateGate
        viewState={reportViewState}
        loadingTitle="Opening report form"
        emptyTitle="Nothing to report"
        emptyDescription="No recent interaction is available for reporting."
        errorDescription="We could not load the report form."
        ready={
          <Card>
            <CardHeader>
              <CardTitle>Report details</CardTitle>
              <CardDescription>
                We will record your report and limit contact while you decide next steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Started from: {source}</p>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Reason</legend>
                {reportReasons.map((reason) => (
                  <label key={reason.id} className="flex items-start gap-2 rounded-md border p-3 text-sm">
                    <input
                      type="radio"
                      name="reason"
                      className="mt-0.5"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={(event) => setSelectedReason(event.target.value)}
                    />
                    {reason.label}
                  </label>
                ))}
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="details">Additional context (optional)</Label>
                <Textarea id="details" placeholder="Add short context if needed." />
              </div>
              {!selectedReason ? (
                <p className="text-xs text-muted-foreground">Select a reason to enable report submission.</p>
              ) : (
                <p className="text-xs text-muted-foreground">Reason selected. Report submission is enabled.</p>
              )}
              <ResponsiveActionRow>
                <Button variant="destructive" disabled={!selectedReason}>
                  Submit report
                </Button>
                <Link
                  href={source === "conversation" ? "/conversation" : "/match"}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Cancel
                </Link>
              </ResponsiveActionRow>
            </CardContent>
          </Card>
        }
      />
    </AppShell>
  );
}
