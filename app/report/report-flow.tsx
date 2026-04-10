"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { submitReportAction } from "@/app/actions/safety";
import { PageStateGate } from "@/components/page-state-gate";
import { ResponsiveActionRow } from "@/components/responsive-action-row";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isAuthMisconfiguredCode, isHttpErrorCode, isResponseIntegrityCode } from "@/lib/auth/action-failure-ui";
import { SERVER_ACTION_AUTH_IDENTITY_MISMATCH, SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import {
  presentClientThrownActionFailure,
  serverActionFailureTitle
} from "@/lib/auth/server-action-failure-copy";
import { normalizeEntryPoint } from "@/lib/safety/entry-point";
import { reportReasonOptions } from "@/lib/safety/report-reasons";
import type { ViewState } from "@/lib/types/ui-state";
import { issuesByPath, NETWORK_ERROR_MESSAGE } from "@/lib/validation/zod-issues";
import { ReportReason } from "@prisma/client";

export function ReportFlow() {
  const searchParams = useSearchParams();
  const submitGuard = useRef(false);
  const source = normalizeEntryPoint(searchParams.get("from") ?? undefined);
  const reportedUserId = searchParams.get("reportedUserId")?.trim() ?? "";
  const matchIdRaw = searchParams.get("matchId")?.trim();

  const [selectedReason, setSelectedReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState("");
  const [submitErrorTitle, setSubmitErrorTitle] = useState("Could not submit report");
  const [setupMessage, setSetupMessage] = useState("");
  const [unexpectedApi, setUnexpectedApi] = useState<{ title: string; message: string } | null>(null);
  const [identityMismatchMessage, setIdentityMismatchMessage] = useState("");
  const [serverPaths, setServerPaths] = useState<Record<string, string>>({});
  const [signedOut, setSignedOut] = useState(false);
  const [done, setDone] = useState(false);

  const viewState: ViewState = !reportedUserId ? "empty" : "ready";

  const onSubmit = () => {
    if (submitGuard.current || isPending || !selectedReason) return;
    submitGuard.current = true;
    setSubmitError("");
    setSubmitErrorTitle("Could not submit report");
    setSetupMessage("");
    setUnexpectedApi(null);
    setIdentityMismatchMessage("");
    setServerPaths({});
    setSignedOut(false);
    startTransition(async () => {
      try {
        const result = await submitReportAction({
          reportedUserId,
          matchId: matchIdRaw && matchIdRaw.length > 0 ? matchIdRaw : undefined,
          reason: selectedReason,
          details: details.trim().length > 0 ? details.trim() : undefined
        });
        if (!result.ok) {
          submitGuard.current = false;
          if (result.code === SERVER_ACTION_UNAUTHORIZED) {
            setSignedOut(true);
            return;
          }
          if (result.code === SERVER_ACTION_AUTH_IDENTITY_MISMATCH) {
            setIdentityMismatchMessage(result.message);
            return;
          }
          if (isAuthMisconfiguredCode(result.code)) {
            setSetupMessage(result.message);
            return;
          }
          if (isResponseIntegrityCode(result.code) || isHttpErrorCode(result.code)) {
            setUnexpectedApi({
              title: serverActionFailureTitle(result.code),
              message: result.message
            });
            return;
          }
          if (result.issues?.length) {
            setServerPaths(issuesByPath(result.issues));
          }
          setSubmitErrorTitle(serverActionFailureTitle(result.code));
          setSubmitError(result.message);
          return;
        }
        setDone(true);
      } catch (e) {
        submitGuard.current = false;
        const { title, message } = presentClientThrownActionFailure(e);
        setSubmitErrorTitle(title);
        setSubmitError(message);
      }
    });
  };

  if (signedOut) {
    return <SignedOutPrompt />;
  }

  const zReason = serverPaths.reason;
  const zDetails = serverPaths.details;
  const zReported = serverPaths.reportedUserId;
  const zMatch = serverPaths.matchId;
  const showBulkError =
    Boolean(submitError) &&
    Object.keys(serverPaths).length === 0 &&
    !setupMessage &&
    !unexpectedApi &&
    !identityMismatchMessage;

  const flowBlocked = Boolean(identityMismatchMessage);

  return (
    <PageStateGate
      viewState={viewState}
      loadingTitle="Opening report form"
      emptyTitle="Nothing to report"
      emptyDescription="Open Report from an active match with a selected user."
      errorDescription="We could not load the report form."
      ready={
        done ? (
          <Card role="status" aria-live="polite" className="border-primary/20 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle>Report submitted</CardTitle>
              <CardDescription>We recorded your report and will follow up as needed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Thanks — your report was received.</p>
              <Link href="/dashboard" className={buttonVariants({ className: "w-full" })}>
                Back to dashboard
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Report details</CardTitle>
              <CardDescription>
                We will record your report and limit contact while you decide next steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" aria-busy={isPending}>
              <p className="text-xs text-muted-foreground">Started from: {source}</p>
              {zReported ? <p className="text-xs text-destructive">{zReported}</p> : null}
              {zMatch ? <p className="text-xs text-destructive">{zMatch}</p> : null}

              {setupMessage ? (
                <Alert>
                  <AlertTitle>API setup required</AlertTitle>
                  <AlertDescription>{setupMessage}</AlertDescription>
                </Alert>
              ) : null}

              {unexpectedApi ? (
                <Alert variant="destructive">
                  <AlertTitle>{unexpectedApi.title}</AlertTitle>
                  <AlertDescription>{unexpectedApi.message}</AlertDescription>
                </Alert>
              ) : null}

              {identityMismatchMessage ? (
                <Alert variant="destructive">
                  <AlertTitle>Session mismatch</AlertTitle>
                  <AlertDescription>{identityMismatchMessage}</AlertDescription>
                </Alert>
              ) : null}

              {showBulkError ? (
                <Alert variant="destructive">
                  <AlertTitle>{submitErrorTitle}</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              ) : null}

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Reason</legend>
                {reportReasonOptions.map((reason) => (
                  <label key={reason.id} className="flex items-start gap-2 rounded-md border p-3 text-sm">
                    <input
                      type="radio"
                      name="reason"
                      className="mt-0.5"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      disabled={isPending || flowBlocked}
                      onChange={() => {
                        setSelectedReason(reason.id);
                        setServerPaths((p) => {
                          const n = { ...p };
                          delete n.reason;
                          return n;
                        });
                      }}
                    />
                    {reason.label}
                  </label>
                ))}
              </fieldset>
              {zReason ? <p className="text-xs text-destructive">{zReason}</p> : null}

              <div className="space-y-2">
                <Label htmlFor="details">Additional context (optional)</Label>
                <Textarea
                  id="details"
                  placeholder="Add short context if needed."
                  value={details}
                  disabled={isPending || flowBlocked}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    setServerPaths((p) => {
                      const n = { ...p };
                      delete n.details;
                      return n;
                    });
                  }}
                  aria-invalid={Boolean(zDetails)}
                />
                {zDetails ? <p className="text-xs text-destructive">{zDetails}</p> : null}
              </div>
              {!selectedReason ? (
                <p className="text-xs text-muted-foreground">Select a reason to enable report submission.</p>
              ) : (
                <p className="text-xs text-muted-foreground">Reason selected. Report submission is enabled.</p>
              )}
              <ResponsiveActionRow>
                <Button
                  variant="destructive"
                  disabled={!selectedReason || isPending || flowBlocked}
                  onClick={onSubmit}
                  aria-busy={isPending}
                >
                  {isPending ? "Submitting…" : "Submit report"}
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
        )
      }
    />
  );
}
