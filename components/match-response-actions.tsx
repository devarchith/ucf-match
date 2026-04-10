"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

import { submitMatchResponseAction } from "@/app/actions/match";
import { ResponsiveActionRow } from "@/components/responsive-action-row";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isAuthMisconfiguredCode, isHttpErrorCode, isResponseIntegrityCode } from "@/lib/auth/action-failure-ui";
import {
  SERVER_ACTION_AUTH_IDENTITY_MISMATCH,
  SERVER_ACTION_CONFLICT,
  SERVER_ACTION_FORBIDDEN,
  SERVER_ACTION_NETWORK_FAILURE,
  SERVER_ACTION_NOT_FOUND,
  SERVER_ACTION_SERVER_ERROR,
  SERVER_ACTION_UNAUTHORIZED
} from "@/lib/auth/action-auth";
import {
  presentClientThrownActionFailure,
  serverActionFailureTitle
} from "@/lib/auth/server-action-failure-copy";

const RESPONSE_STORAGE_PREFIX = "ucf-match:mr:";

function readStoredResponse(matchId: string): "accepted" | "passed" | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RESPONSE_STORAGE_PREFIX + matchId);
  return raw === "accepted" ? "accepted" : raw === "passed" ? "passed" : null;
}

function failureTitle(code: string | undefined, httpHint: "forbidden" | "conflict" | null): string {
  if (code === SERVER_ACTION_AUTH_IDENTITY_MISMATCH) return "Session mismatch";
  if (isAuthMisconfiguredCode(code)) return "API setup required";
  if (isResponseIntegrityCode(code) || isHttpErrorCode(code)) {
    return serverActionFailureTitle(code);
  }
  if (code === SERVER_ACTION_NETWORK_FAILURE) return "Connection problem";
  if (code === SERVER_ACTION_NOT_FOUND) return "Match not found";
  if (code === SERVER_ACTION_SERVER_ERROR) return "Server error";
  if (code === SERVER_ACTION_FORBIDDEN || httpHint === "forbidden") return "Action not allowed";
  if (code === SERVER_ACTION_CONFLICT || httpHint === "conflict") return "Match already updated";
  return serverActionFailureTitle(code);
}

export function MatchResponseActions({ matchId }: { matchId: string }) {
  const submitGuard = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("");
  const [signedOut, setSignedOut] = useState(false);
  const [identityMismatchMessage, setIdentityMismatchMessage] = useState("");
  /** Primary post-success state — no full route refresh so the UI stays deterministic. */
  const [localSuccess, setLocalSuccess] = useState<"accepted" | "passed" | null>(null);

  /** Hydrate from sessionStorage before paint so we do not flash enabled buttons after a prior success. */
  useLayoutEffect(() => {
    setLocalSuccess(readStoredResponse(matchId));
  }, [matchId]);

  useEffect(() => {
    setErrorMessage("");
    setErrorTitle("");
    setIdentityMismatchMessage("");
  }, [matchId]);

  const responded = localSuccess;
  const flowBlocked = Boolean(identityMismatchMessage);

  const runResponse = (kind: "ACCEPTED" | "DECLINED") => {
    if (submitGuard.current || isPending || responded || flowBlocked) return;
    submitGuard.current = true;
    setErrorMessage("");
    setErrorTitle("");
    setSignedOut(false);
    setIdentityMismatchMessage("");
    startTransition(async () => {
      try {
        const result = await submitMatchResponseAction(matchId, kind);
        if (!result.ok) {
          submitGuard.current = false;
          if ("code" in result && result.code === SERVER_ACTION_UNAUTHORIZED) {
            setSignedOut(true);
            return;
          }
          if ("code" in result && result.code === SERVER_ACTION_AUTH_IDENTITY_MISMATCH) {
            setIdentityMismatchMessage(result.message);
            return;
          }
          const code = "code" in result ? result.code : undefined;
          const hint =
            code === SERVER_ACTION_FORBIDDEN
              ? ("forbidden" as const)
              : code === SERVER_ACTION_CONFLICT
                ? ("conflict" as const)
                : null;
          setErrorTitle(failureTitle(code, hint));
          setErrorMessage(result.message);
          return;
        }
        const label = kind === "ACCEPTED" ? "accepted" : "passed";
        try {
          sessionStorage.setItem(RESPONSE_STORAGE_PREFIX + matchId, label);
        } catch {
          /* ignore quota / private mode — UI still locks via localSuccess */
        }
        setLocalSuccess(label);
        submitGuard.current = false;
      } catch (e) {
        submitGuard.current = false;
        const { title, message } = presentClientThrownActionFailure(e);
        setErrorTitle(title);
        setErrorMessage(message);
      }
    });
  };

  if (signedOut) {
    return <SignedOutPrompt />;
  }

  return (
    <div className="space-y-3">
      {responded ? (
        <Alert role="status" aria-live="polite" className="border-primary/25 bg-primary/[0.04]">
          <AlertTitle>{responded === "accepted" ? "Accepted" : "Passed"}</AlertTitle>
          <AlertDescription>
            {responded === "accepted"
              ? "Your response is saved for this match. The buttons stay off so you do not double-submit."
              : "Your pass is saved for this match. The buttons stay off so you do not double-submit."}
          </AlertDescription>
        </Alert>
      ) : null}

      {identityMismatchMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Session mismatch</AlertTitle>
          <AlertDescription>{identityMismatchMessage}</AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>{errorTitle || serverActionFailureTitle(undefined)}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <ResponsiveActionRow aria-describedby="match-response-help">
        <Button
          type="button"
          disabled={isPending || responded !== null || flowBlocked}
          aria-busy={isPending}
          onClick={() => runResponse("ACCEPTED")}
        >
          {isPending ? "Saving…" : responded === "accepted" ? "Accepted" : "Accept intro"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || responded !== null || flowBlocked}
          aria-busy={isPending}
          onClick={() => runResponse("DECLINED")}
        >
          {isPending ? "Saving…" : responded === "passed" ? "Passed" : "Pass this week"}
        </Button>
      </ResponsiveActionRow>
      <p id="match-response-help" className="text-xs text-muted-foreground" role="note">
        “Action not allowed” means this operation is not permitted for you on this match. “Match already
        updated” is a 409 — the match state no longer allows that change. “Unexpected … response” points to
        data shape or non-JSON errors, not your sign-in.
      </p>
    </div>
  );
}
