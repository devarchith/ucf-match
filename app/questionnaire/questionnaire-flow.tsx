"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ProgressSteps } from "@/components/progress-steps";
import { EmptyState, ErrorState } from "@/components/state-block";
import { ResponsiveActionRow } from "@/components/responsive-action-row";
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

type Answers = Record<PromptId, string>;

export function QuestionnaireFlow() {
  const schedulePrompt = getAvailabilityPrompt();
  const vibePrompts = getPromptsByGroup("vibe");

  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [answers, setAnswers] = useState<Answers>(() => createInitialAnswers());
  const [errors, setErrors] = useState<Partial<Record<PromptId, string>>>({});

  const requiredPrompts = useMemo(() => weeklyPrompts.filter((prompt) => prompt.required), []);
  const completedRequired = requiredPrompts.filter((prompt) => answers[prompt.id].trim().length > 0).length;

  const updateAnswer = (id: PromptId, value: string) => {
    setSaved(false);
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<PromptId, string>> = {};
    for (const prompt of requiredPrompts) {
      if (!answers[prompt.id]?.trim()) {
        nextErrors[prompt.id] = "This answer is required for matching quality.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onContinue = () => {
    if (step === 1 && !validate()) return;
    setStep((current) => Math.min(current + 1, questionnaireSteps.length - 1));
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly check-in</CardTitle>
        <CardDescription>
          2-3 short prompts keep intros relevant. You can save now and finish later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressSteps steps={questionnaireSteps} currentStep={step} />

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
              />
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
                  aria-invalid={Boolean(errors[prompt.id])}
                />
                {errors[prompt.id] ? <p className="text-xs text-destructive">{errors[prompt.id]}</p> : null}
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
          <Button variant="outline" onClick={() => setSaved(true)}>
            Save and continue later
          </Button>
          {step < questionnaireSteps.length - 1 ? (
            <Button onClick={onContinue}>Continue</Button>
          ) : (
            <Button onClick={validate}>Submit questionnaire</Button>
          )}
        </ResponsiveActionRow>
        <Button
          variant="ghost"
          className="w-full"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
        >
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
