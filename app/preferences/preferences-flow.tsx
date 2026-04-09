"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { submitPreferencesAction } from "@/app/actions/preferences";
import { ProgressSteps } from "@/components/progress-steps";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PreferencesDraft, PreferenceLevel, preferencesDraft, preferencesSteps } from "@/lib/mock/flows";
import type { SerializedZodIssue } from "@/lib/validation/zod-issues";
import { NETWORK_ERROR_MESSAGE } from "@/lib/validation/zod-issues";

type PreferenceField = keyof PreferencesDraft;

const preferenceLevels: Array<{ value: PreferenceLevel; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

const stepConfig: Array<{ field: PreferenceField; title: string; description: string }> = [
  {
    field: "campusAreaDistance",
    title: "Campus area distance",
    description: "How flexible are you about where on or near campus to meet?"
  },
  {
    field: "conversationPace",
    title: "Conversation pace",
    description: "Do you prefer slower warm-up chats or faster back-and-forth?"
  },
  {
    field: "meetingWindows",
    title: "Preferred meeting windows",
    description: "How strict should timing compatibility be for first plans?"
  }
];

function toPreferencesPayload(form: PreferencesDraft) {
  return {
    preferredGenders: ["No preference"],
    interests: [
      `Campus area flexibility: ${form.campusAreaDistance}`,
      `Meeting windows: ${form.meetingWindows}`
    ],
    communicationStyle: `Conversation pace: ${form.conversationPace}`
  };
}

export function PreferencesFlow() {
  const router = useRouter();
  const submitGuard = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<PreferencesDraft>(preferencesDraft);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [serverIssues, setServerIssues] = useState<SerializedZodIssue[]>([]);
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  const active = stepConfig[step];
  const activeValue = form[active.field];

  const chooseLevel = (value: PreferenceLevel) => {
    setSaved(false);
    setSaveSucceeded(false);
    setError("");
    setSubmitError("");
    setServerIssues([]);
    setForm((prev) => ({ ...prev, [active.field]: value }));
  };

  const validateStep = () => {
    if (!form[active.field]) {
      setError("Please choose one option before continuing.");
      return false;
    }
    setError("");
    return true;
  };

  const onContinue = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, preferencesSteps.length - 1));
  };

  const onFinishPreferences = () => {
    if (submitGuard.current || isPending) return;
    if (!validateStep()) return;
    submitGuard.current = true;
    setSubmitError("");
    setServerIssues([]);
    setSaveSucceeded(false);
    startTransition(async () => {
      try {
        const result = await submitPreferencesAction(toPreferencesPayload(form));
        if (!result.ok) {
          submitGuard.current = false;
          if (result.issues?.length) {
            setServerIssues(result.issues);
          }
          setSubmitError(result.message);
          return;
        }
        setSaveSucceeded(true);
        setServerIssues([]);
        setSubmitError("");
        await new Promise((r) => setTimeout(r, 450));
        router.push("/dashboard");
      } catch {
        submitGuard.current = false;
        setSubmitError(NETWORK_ERROR_MESSAGE);
      }
    });
  };

  const showBulkError = Boolean(submitError) && serverIssues.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences setup</CardTitle>
        <CardDescription>
          Set simple preference sliders now. You can update them each week before matching.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" aria-busy={isPending || saveSucceeded}>
        <ProgressSteps steps={preferencesSteps} currentStep={step} />

        {saveSucceeded ? (
          <Alert role="status" aria-live="polite" className="border-primary/25 bg-primary/[0.04]">
            <AlertDescription>Preferences saved. Continuing…</AlertDescription>
          </Alert>
        ) : null}

        {serverIssues.length > 0 ? (
          <div className="space-y-1" role="status">
            {serverIssues.map((issue, i) => (
              <p key={`${issue.path}-${i}`} className="text-xs text-destructive">
                {issue.path !== "_root" ? `${issue.path}: ` : ""}
                {issue.message}
              </p>
            ))}
          </div>
        ) : null}

        {showBulkError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save preferences</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-3" aria-label={`${active.title} section`}>
          <div className="space-y-1">
            <Label className="text-sm">{active.title}</Label>
            <p className="text-sm text-muted-foreground">{active.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={active.title}>
            {preferenceLevels.map((level) => {
              const selected = activeValue === level.value;
              return (
                <button
                  key={level.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isPending || saveSucceeded}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50 ${
                    selected ? "border-primary bg-primary/5 font-medium" : "hover:bg-secondary"
                  }`}
                  onClick={() => chooseLevel(level.value)}
                >
                  {level.label}
                </button>
              );
            })}
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <p className="text-xs text-muted-foreground">
            Trust note: these controls help avoid low-fit intros and reduce awkward first plans.
          </p>
        </section>

        {saved ? <p className="text-xs text-muted-foreground">Draft saved locally for this session.</p> : null}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setSaved(true)} disabled={isPending || saveSucceeded}>
            Save draft
          </Button>
          {step < preferencesSteps.length - 1 ? (
            <Button
              onClick={onContinue}
              disabled={isPending || saveSucceeded}
              aria-busy={isPending}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={onFinishPreferences}
              disabled={isPending || saveSucceeded}
              aria-busy={isPending}
            >
              {isPending ? "Saving…" : "Finish preferences"}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          className="w-full"
          disabled={step === 0 || isPending || saveSucceeded}
          onClick={() => {
            setError("");
            setStep((current) => Math.max(current - 1, 0));
          }}
        >
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
