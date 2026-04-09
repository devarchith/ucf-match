"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { submitBlockAction } from "@/app/actions/safety";
import { PageStateGate } from "@/components/page-state-gate";
import { ResponsiveActionRow } from "@/components/responsive-action-row";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import { normalizeEntryPoint } from "@/lib/safety/entry-point";
import type { ViewState } from "@/lib/types/ui-state";
import { issuesByPath, NETWORK_ERROR_MESSAGE } from "@/lib/validation/zod-issues";

export function BlockFlow() {
  const searchParams = useSearchParams();
  const submitGuard = useRef(false);
  const source = normalizeEntryPoint(searchParams.get("from") ?? undefined);
  const blockedUserId = searchParams.get("blockedUserId")?.trim() ?? "";

  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState("");
  const [serverPaths, setServerPaths] = useState<Record<string, string>>({});
  const [signedOut, setSignedOut] = useState(false);
  const [done, setDone] = useState(false);

  const viewState: ViewState = !blockedUserId ? "empty" : "ready";

  const onConfirm = () => {
    if (submitGuard.current || isPending || !confirmed) return;
    submitGuard.current = true;
    setSubmitError("");
    setServerPaths({});
    setSignedOut(false);
    startTransition(async () => {
      try {
        const result = await submitBlockAction({ blockedUserId });
        if (!result.ok) {
          submitGuard.current = false;
          if (result.code === SERVER_ACTION_UNAUTHORIZED) {
            setSignedOut(true);
            return;
          }
          if (result.issues?.length) {
            setServerPaths(issuesByPath(result.issues));
          }
          setSubmitError(result.message);
          return;
        }
        setDone(true);
      } catch {
        submitGuard.current = false;
        setSubmitError(NETWORK_ERROR_MESSAGE);
      }
    });
  };

  if (signedOut) {
    return <SignedOutPrompt />;
  }

  const zBlocked = serverPaths.blockedUserId;
  const showBulkError = Boolean(submitError) && Object.keys(serverPaths).length === 0;

  return (
    <PageStateGate
      viewState={viewState}
      loadingTitle="Opening block confirmation"
      emptyTitle="No user selected"
      emptyDescription="Open Block from an active match with a selected user."
      errorDescription="We could not load block confirmation."
      ready={
        done ? (
          <Card role="status" aria-live="polite" className="border-primary/20 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle>User blocked</CardTitle>
              <CardDescription>Future match interactions with this person are restricted.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Block is in effect for this account.</p>
              <Link href="/dashboard" className={buttonVariants({ className: "w-full" })}>
                Back to dashboard
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Confirm block</CardTitle>
              <CardDescription>
                You will no longer be matched with this person, and future in-app contact will stay
                limited until messaging is available.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" aria-busy={isPending}>
              <p className="text-sm text-muted-foreground">
                If there was harmful behavior, submit a report as well so we can take appropriate action.
              </p>
              <p className="text-xs text-muted-foreground">Started from: {source}</p>

              {zBlocked ? <p className="text-xs text-destructive">{zBlocked}</p> : null}

              {showBulkError ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not block user</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              ) : null}

              <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={confirmed}
                  disabled={isPending}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    setServerPaths((p) => {
                      const n = { ...p };
                      delete n.blockedUserId;
                      return n;
                    });
                  }}
                />
                I understand this will immediately block future messages and match interactions with this person.
              </label>
              <ResponsiveActionRow>
                <Button
                  variant="destructive"
                  disabled={!confirmed || isPending}
                  onClick={onConfirm}
                  aria-busy={isPending}
                >
                  {isPending ? "Submitting…" : "Confirm block"}
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
                href={`/report?from=${source}&reportedUserId=${encodeURIComponent(blockedUserId)}`}
                className={buttonVariants({ variant: "ghost", className: "w-full" })}
              >
                Report instead
              </Link>
            </CardContent>
          </Card>
        )
      }
    />
  );
}
