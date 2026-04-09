"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { submitProfileAction } from "@/app/actions/profile";
import { ProgressSteps } from "@/components/progress-steps";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingDraft, onboardingDraft, onboardingSteps } from "@/lib/mock/flows";
import { issuesByPath, NETWORK_ERROR_MESSAGE } from "@/lib/validation/zod-issues";

type FieldErrors = Partial<Record<keyof OnboardingDraft, string>>;

export function OnboardingFlow() {
  const router = useRouter();
  const submitGuard = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<OnboardingDraft>(onboardingDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [serverPaths, setServerPaths] = useState<Record<string, string>>({});
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  const clearServerPath = (keys: string[]) => {
    setServerPaths((prev) => {
      const next = { ...prev };
      for (const k of keys) delete next[k];
      return next;
    });
  };

  const updateField = (field: keyof OnboardingDraft, value: string) => {
    setSaved(false);
    setSaveSucceeded(false);
    setSubmitError("");
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === "firstName") clearServerPath(["firstName"]);
    if (field === "lastName") clearServerPath(["lastName"]);
    if (field === "major") clearServerPath(["major"]);
    if (field === "graduationYear") clearServerPath(["graduationYear"]);
    if (field === "intro" || field === "boundaries") clearServerPath(["bio"]);
  };

  const validateCurrentStep = () => {
    const nextErrors: FieldErrors = {};
    if (step === 0) {
      if (!form.firstName.trim()) nextErrors.firstName = "Please add your first name.";
      if (!form.lastName.trim()) nextErrors.lastName = "Please add your last name.";
      if (!form.major.trim()) nextErrors.major = "Please add your major.";
      const gradRaw = form.graduationYear.trim();
      if (gradRaw.length > 0) {
        const y = Number.parseInt(gradRaw, 10);
        const current = new Date().getFullYear();
        if (Number.isNaN(y) || y < current || y > current + 12) {
          nextErrors.graduationYear = `Enter a year between ${current} and ${current + 12}, or leave this blank.`;
        }
      }
    }
    if (step === 1 && form.intro.trim().length < 20) {
      nextErrors.intro = "Add at least 20 characters so your match has context.";
    }
    if (step === 2 && !form.boundaries.trim()) {
      nextErrors.boundaries = "Share at least one boundary or preference.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onContinue = () => {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(current + 1, onboardingSteps.length - 1));
  };

  const onSaveDraft = () => {
    setSaved(true);
  };

  const onFinishProfile = () => {
    if (submitGuard.current || isPending) return;
    if (!validateCurrentStep()) return;
    submitGuard.current = true;
    setSubmitError("");
    setServerPaths({});
    setSaveSucceeded(false);
    startTransition(async () => {
      try {
        const graduationYearRaw = form.graduationYear.trim();
        const parsedYear = graduationYearRaw ? Number.parseInt(graduationYearRaw, 10) : undefined;
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          major: form.major.trim() || undefined,
          graduationYear:
            parsedYear !== undefined && !Number.isNaN(parsedYear) ? parsedYear : undefined,
          bio:
            [form.intro.trim(), form.boundaries.trim()].filter(Boolean).join("\n\n").slice(0, 500) ||
            undefined
        };
        const result = await submitProfileAction(payload);
        if (!result.ok) {
          submitGuard.current = false;
          if (result.issues?.length) {
            setServerPaths(issuesByPath(result.issues));
          }
          setSubmitError(result.message);
          return;
        }
        setSaveSucceeded(true);
        setServerPaths({});
        setSubmitError("");
        await new Promise((r) => setTimeout(r, 450));
        router.push("/dashboard");
      } catch {
        submitGuard.current = false;
        setSubmitError(NETWORK_ERROR_MESSAGE);
      }
    });
  };

  const showBulkError = Boolean(submitError) && Object.keys(serverPaths).length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile setup</CardTitle>
        <CardDescription>
          Short, clear answers help us generate safer and more intentional introductions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" aria-busy={isPending || saveSucceeded}>
        <ProgressSteps steps={onboardingSteps} currentStep={step} />

        {saveSucceeded ? (
          <Alert role="status" aria-live="polite" className="border-primary/25 bg-primary/[0.04]">
            <AlertDescription>Profile saved. Continuing…</AlertDescription>
          </Alert>
        ) : null}

        {showBulkError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save profile</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        {step === 0 ? (
          <section className="space-y-3" aria-label="Basics section">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                placeholder="Mia"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                aria-invalid={Boolean(errors.firstName || serverPaths.firstName)}
              />
              {errors.firstName || serverPaths.firstName ? (
                <p className="text-xs text-destructive">{errors.firstName ?? serverPaths.firstName}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                placeholder="Knight"
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                aria-invalid={Boolean(errors.lastName || serverPaths.lastName)}
              />
              {errors.lastName || serverPaths.lastName ? (
                <p className="text-xs text-destructive">{errors.lastName ?? serverPaths.lastName}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                placeholder="Health Sciences"
                value={form.major}
                onChange={(event) => updateField("major", event.target.value)}
                aria-invalid={Boolean(errors.major || serverPaths.major)}
              />
              {errors.major || serverPaths.major ? (
                <p className="text-xs text-destructive">{errors.major ?? serverPaths.major}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="grad-year">Graduation Year (optional)</Label>
              <Input
                id="grad-year"
                placeholder="2028"
                value={form.graduationYear}
                onChange={(event) => updateField("graduationYear", event.target.value)}
                aria-invalid={Boolean(errors.graduationYear || serverPaths.graduationYear)}
              />
              {errors.graduationYear || serverPaths.graduationYear ? (
                <p className="text-xs text-destructive">
                  {serverPaths.graduationYear ?? errors.graduationYear}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="space-y-3" aria-label="About you section">
            <div className="space-y-2">
              <Label htmlFor="intro">How would you describe your conversation style?</Label>
              <Textarea
                id="intro"
                placeholder="I like thoughtful but low-pressure conversations..."
                value={form.intro}
                onChange={(event) => updateField("intro", event.target.value)}
                aria-invalid={Boolean(errors.intro)}
              />
              <p className="text-xs text-muted-foreground">Keep it brief. 1-3 lines is enough.</p>
              {errors.intro ? <p className="text-xs text-destructive">{errors.intro}</p> : null}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-3" aria-label="Comfort section">
            <div className="space-y-2">
              <Label htmlFor="boundaries">Any boundaries or preferences for first meetups?</Label>
              <Textarea
                id="boundaries"
                placeholder="Prefer daytime meetups on campus and clear planning."
                value={form.boundaries}
                onChange={(event) => updateField("boundaries", event.target.value)}
                aria-invalid={Boolean(errors.boundaries || serverPaths.bio)}
              />
              {errors.boundaries ? <p className="text-xs text-destructive">{errors.boundaries}</p> : null}
              {serverPaths.bio ? <p className="text-xs text-destructive">{serverPaths.bio}</p> : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Trust note: this helps reduce awkward or unsafe first interactions.
            </p>
          </section>
        ) : null}

        {saved ? <p className="text-xs text-muted-foreground">Draft saved locally for this session.</p> : null}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onSaveDraft} disabled={isPending || saveSucceeded}>
            Save draft
          </Button>
          {step < onboardingSteps.length - 1 ? (
            <Button
              onClick={onContinue}
              disabled={isPending || saveSucceeded}
              aria-busy={isPending}
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={onFinishProfile}
              disabled={isPending || saveSucceeded}
              aria-busy={isPending}
            >
              {isPending ? "Saving…" : "Finish profile"}
            </Button>
          )}
        </div>
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
