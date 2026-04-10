"use client";

import { ParticipationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { optIntoActiveWeekAction } from "@/app/actions/week";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthMisconfiguredCode, isHttpErrorCode, isResponseIntegrityCode } from "@/lib/auth/action-failure-ui";
import {
  SERVER_ACTION_AUTH_IDENTITY_MISMATCH,
  SERVER_ACTION_CONFLICT,
  SERVER_ACTION_FORBIDDEN,
  SERVER_ACTION_NETWORK_FAILURE,
  SERVER_ACTION_UNAUTHORIZED
} from "@/lib/auth/action-auth";
import { serverActionFailureTitle } from "@/lib/auth/server-action-failure-copy";
import { NETWORK_ERROR_MESSAGE } from "@/lib/validation/zod-issues";

type WeeklyOptInFormProps = {
  weekLabel: string | null;
  noActiveWeek: boolean;
  canOptIn: boolean;
  eligibilityReason: string | null;
  participationStatus: ParticipationStatus;
};

export function WeeklyOptInForm({
  weekLabel,
  noActiveWeek,
  canOptIn,
  eligibilityReason,
  participationStatus
}: WeeklyOptInFormProps) {
  const router = useRouter();
  const submitGuard = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [errorTitle, setErrorTitle] = useState("Could not opt in");
  const [setupMessage, setSetupMessage] = useState("");
  const [unexpectedApi, setUnexpectedApi] = useState<{ title: string; message: string } | null>(null);
  const [identityMismatchMessage, setIdentityMismatchMessage] = useState("");
  const [signedOut, setSignedOut] = useState(false);
  const [optInSucceeded, setOptInSucceeded] = useState(false);
  const [confirmTiming, setConfirmTiming] = useState(false);
  const [confirmSafety, setConfirmSafety] = useState(false);

  const alreadyOptedIn =
    participationStatus === ParticipationStatus.OPTED_IN ||
    participationStatus === ParticipationStatus.MATCHED;

  const flowBlocked = Boolean(identityMismatchMessage || unexpectedApi);

  const onOptIn = () => {
    if (submitGuard.current || isPending || optInSucceeded) return;
    submitGuard.current = true;
    setError("");
    setErrorTitle("Could not opt in");
    setSetupMessage("");
    setUnexpectedApi(null);
    setIdentityMismatchMessage("");
    setSignedOut(false);
    setOptInSucceeded(false);
    startTransition(async () => {
      try {
        const result = await optIntoActiveWeekAction();
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
          if (result.code === SERVER_ACTION_NETWORK_FAILURE) {
            setErrorTitle(serverActionFailureTitle(result.code));
            setError(result.message);
            return;
          }
          if (result.code === SERVER_ACTION_FORBIDDEN) {
            setErrorTitle(serverActionFailureTitle(result.code));
            setError(result.message);
            return;
          }
          if (result.code === SERVER_ACTION_CONFLICT) {
            setErrorTitle(serverActionFailureTitle(result.code));
            setError(result.message);
            return;
          }
          setErrorTitle(serverActionFailureTitle(result.code));
          setError(result.message);
          return;
        }
        setOptInSucceeded(true);
        await new Promise((r) => setTimeout(r, 450));
        router.push("/dashboard");
      } catch {
        submitGuard.current = false;
        setErrorTitle("Could not opt in");
        setError(NETWORK_ERROR_MESSAGE);
      }
    });
  };

  const checksOk = confirmTiming && confirmSafety;
  const canSubmit =
    !signedOut &&
    !noActiveWeek &&
    canOptIn &&
    !alreadyOptedIn &&
    checksOk &&
    !isPending &&
    !optInSucceeded &&
    !flowBlocked;

  if (signedOut) {
    return <SignedOutPrompt />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ready for this week?</CardTitle>
        <CardDescription>Opt-in is explicit each cycle to reduce ghosting and stale matches.</CardDescription>
        {weekLabel ? (
          <p className="text-sm text-muted-foreground">Active week: {weekLabel}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3" aria-busy={isPending || optInSucceeded}>
        {optInSucceeded ? (
          <Alert role="status" aria-live="polite" className="border-primary/25 bg-primary/[0.04]">
            <AlertDescription>You are opted in. Continuing…</AlertDescription>
          </Alert>
        ) : null}

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

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>{errorTitle}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {noActiveWeek ? (
          <Alert>
            <AlertTitle>No active week</AlertTitle>
            <AlertDescription>Check back when a new weekly cycle opens.</AlertDescription>
          </Alert>
        ) : null}

        {!noActiveWeek && !canOptIn && eligibilityReason ? (
          <Alert>
            <AlertTitle>Not eligible yet</AlertTitle>
            <AlertDescription>{eligibilityReason}</AlertDescription>
          </Alert>
        ) : null}

        {alreadyOptedIn ? (
          <Alert>
            <AlertTitle>You are already in this week&apos;s pool</AlertTitle>
            <AlertDescription>
              {participationStatus === ParticipationStatus.MATCHED
                ? "You have a match for this cycle."
                : "You are opted in for this cycle."}
            </AlertDescription>
          </Alert>
        ) : null}

        <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={confirmTiming}
            onChange={(e) => setConfirmTiming(e.target.checked)}
            disabled={
              alreadyOptedIn || noActiveWeek || !canOptIn || isPending || optInSucceeded || flowBlocked
            }
          />
          I confirm I can message and schedule within 48 hours if matched.
        </label>
        <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={confirmSafety}
            onChange={(e) => setConfirmSafety(e.target.checked)}
            disabled={
              alreadyOptedIn || noActiveWeek || !canOptIn || isPending || optInSucceeded || flowBlocked
            }
          />
          I agree to community and safety expectations for UCF students.
        </label>
        <Button className="w-full" disabled={!canSubmit} onClick={onOptIn} aria-busy={isPending}>
          {isPending ? "Submitting…" : "Opt in for this week"}
        </Button>
      </CardContent>
    </Card>
  );
}
