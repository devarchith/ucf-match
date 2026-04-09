"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import { submitQuestionnaireAction } from "@/app/actions/questionnaire";
import { ProgressSteps } from "@/components/progress-steps";
import { EmptyState, ErrorState } from "@/components/state-block";
import { ResponsiveActionRow } from "@/components/responsive-action-row";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PromptId,
  createInitialAnswers,
  getAvailabilityPrompt,
  getPromptsByGroup,
  questionnaireSteps,
  weeklyPrompts
} from "@/lib/mock/flows";
import type { SerializedZodIssue } from "@/lib/validation/zod-issues";
import { NETWORK_ERROR_MESSAGE } from "@/lib/validation/zod-issues";

type Answers = Record<PromptId, string>;

const PROMPT_IDS: PromptId[] = ["schedule", "plans", "topic"];
const MIN_REQUIRED_ANSWER_LENGTH = 10;

function splitQuestionnaireIssues(issues: SerializedZodIssue[]): {
  perField: Partial<Record<PromptId, string>>;
  general: string[];
} {
  const perField: Partial<Record<PromptId, string>> = {};
  const general: string[] = [];
  for (const row of issues) {
    if (row.path === "answers" || row.path === "_root") {
      general.push(row.message);
      continue;
    }
    const prefix = "answers.";
    if (row.path.startsWith(prefix)) {
      const key = row.path.slice(prefix.length) as PromptId;
      if (PROMPT_IDS.includes(key) && !perField[key]) {
        perField[key] = row.message;
      } else {
        general.push(row.message);
      }
    } else {
      general.push(row.message);
    }
  }
  return { perField, general };
}

export function QuestionnaireFlow() {
  const router = useRouter();
  const submitGuard = useRef(false);
  const [isPending, startTransition] = useTransition();
  const schedulePrompt = getAvailabilityPrompt();
  const vibePrompts = getPromptsByGroup("vibe");

  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [answers, setAnswers] = useState<Answers>(() => createInitialAnswers());
  const [errors, setErrors] = useState<Partial<Record<PromptId, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<Partial<Record<PromptId, string>>>({});
  const [serverGeneralErrors, setServerGeneralErrors] = useState<string[]>([]);
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  const requiredPrompts = useMemo(() => weeklyPrompts.filter((prompt) => prompt.required), []);
  const completedRequired = requiredPrompts.filter((prompt) => answers[prompt.id].trim().length > 0).length;

  const updateAnswer = (id: PromptId, value: string) => {
    setSaved(false);
    setSaveSucceeded(false);
    setSubmitError("");
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: undefined }));
    setServerFieldErrors((prev) => ({ ...prev, [id]: undefined }));
    setServerGeneralErrors([]);
  };

  const validate = () => {
    const nextErrors: Partial<Record<PromptId, string>> = {};
    for (const prompt of requiredPrompts) {
      const value = answers[prompt.id]?.trim() ?? "";
      if (!value) {
        nextErrors[prompt.id] = "This answer is required for matching quality.";
      } else if (value.length < MIN_REQUIRED_ANSWER_LENGTH) {
        nextErrors[prompt.id] = `Add at least ${MIN_REQUIRED_ANSWER_LENGTH} characters so your match has enough context.`;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onContinue = () => {
    if (step === 1 && !validate()) return;
    setStep((current) => Math.min(current + 1, questionnaireSteps.length - 1));
  };

  const onSubmitQuestionnaire = () => {
    if (submitGuard.current || isPending) return;
    if (!validate()) return;
    submitGuard.current = true;
    setSubmitError("");
    setServerFieldErrors({});
    setServerGeneralErrors([]);
    setSaveSucceeded(false);
    startTransition(async () => {
      try {
        const result = await submitQuestionnaireAction({ answers });
        if (!result.ok) {
          submitGuard.current = false;
          if (result.issues?.length) {
            const { perField, general } = splitQuestionnaireIssues(result.issues);
            setServerFieldErrors(perField);
            setServerGeneralErrors(general);
          }
          setSubmitError(result.message);
          return;
        }
        setSaveSucceeded(true);
        setServerFieldErrors({});
        setServerGeneralErrors([]);
        setSubmitError("");
        await new Promise((r) => setTimeout(r, 450));
        router.push("/dashboard");
      } catch {
        submitGuard.current = false;
        setSubmitError(NETWORK_ERROR_MESSAGE);
      }
    });
  };

  if (!schedulePrompt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Questionnaire config error</CardTitle>
          <CardDescription>We could not load this questionnaire section right now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ErrorState description="Missing required schedule prompt for availability step." />
          {process.env.NODE_ENV !== "production" ? (
            <p className="text-xs text-muted-foreground">
              Dev detail: expected prompt id `schedule` with group `availability` in prompt config.
            </p>
          ) : null}
          <ResponsiveActionRow>
            <button
              type="button"
              className={buttonVariants({ variant: "outline" })}
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Back to dashboard
            </Link>
          </ResponsiveActionRow>
        </CardContent>
      </Card>
    );
  }

  const showBulkError =
    Boolean(submitError) &&
    Object.keys(serverFieldErrors).length === 0 &&
    serverGeneralErrors.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly check-in</CardTitle>
        <CardDescription>
          2-3 short prompts keep intros relevant. You can save now and finish later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" aria-busy={isPending || saveSucceeded}>
        <ProgressSteps steps={questionnaireSteps} currentStep={step} />

        {saveSucceeded ? (
          <Alert role="status" aria-live="polite" className="border-primary/25 bg-primary/[0.04]">
            <AlertDescription>Questionnaire saved. Continuing…</AlertDescription>
          </Alert>
        ) : null}

        {serverGeneralErrors.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Check your answers</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                {serverGeneralErrors.map((msg, i) => (
                  <li key={`${i}-${msg}`}>{msg}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        {showBulkError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save questionnaire</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        {step === 0 ? (
          <section className="space-y-3" aria-label="Availability section">
            <p className="text-sm text-muted-foreground">
              Quick win: sharing timing early avoids mismatched expectations.
            </p>
            <div className="space-y-2">
              <Label htmlFor="availability">What days/times are realistic this week?</Label>
              <Textarea
                id="availability"
                placeholder={schedulePrompt.placeholder}
                value={answers.schedule}
                onChange={(event) => updateAnswer("schedule", event.target.value)}
                aria-invalid={Boolean(serverFieldErrors.schedule)}
              />
              {serverFieldErrors.schedule ? (
                <p className="text-xs text-destructive">{serverFieldErrors.schedule}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="space-y-3" aria-label="Conversation vibe section">
            {vibePrompts.map((prompt) => (
              <div key={prompt.id} className="space-y-2">
                <Label htmlFor={prompt.id}>{prompt.prompt}</Label>
                <Textarea
                  id={prompt.id}
                  placeholder={prompt.placeholder}
                  value={answers[prompt.id]}
                  onChange={(event) => updateAnswer(prompt.id, event.target.value)}
                  aria-invalid={Boolean(errors[prompt.id] || serverFieldErrors[prompt.id])}
                />
                {errors[prompt.id] || serverFieldErrors[prompt.id] ? (
                  <p className="text-xs text-destructive">
                    {errors[prompt.id] ?? serverFieldErrors[prompt.id]}
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-3" aria-label="Review section">
            <p className="text-sm">
              Required complete: <span className="font-medium">{completedRequired}/2</span>
            </p>
            {completedRequired === 0 ? (
              <EmptyState
                title="No required answers yet"
                description="Add at least the two required prompts to stay in this week’s pool."
              />
            ) : null}
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Trust reminder</p>
              <p className="text-muted-foreground">
                We only use this week’s responses for this week’s matching cycle.
              </p>
            </div>
          </section>
        ) : null}

        {saved ? <p className="text-xs text-muted-foreground">Saved locally. You can continue anytime.</p> : null}

        <ResponsiveActionRow>
          <Button variant="outline" onClick={() => setSaved(true)} disabled={isPending || saveSucceeded}>
            Save and continue later
          </Button>
          {step < questionnaireSteps.length - 1 ? (
            <Button
              onClick={onContinue}
              disabled={isPending || saveSucceeded}
              aria-busy={isPending}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={onSubmitQuestionnaire}
              disabled={isPending || saveSucceeded}
              aria-busy={isPending}
            >
              {isPending ? "Submitting…" : "Submit questionnaire"}
            </Button>
          )}
        </ResponsiveActionRow>
        <Button
          variant="ghost"
          className="w-full"
          disabled={step === 0 || isPending || saveSucceeded}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
        >
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
