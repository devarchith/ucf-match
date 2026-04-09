"use client";

import { useState } from "react";

import { ProgressSteps } from "@/components/progress-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingDraft, onboardingDraft, onboardingSteps } from "@/lib/mock/flows";

type FieldErrors = Partial<Record<keyof OnboardingDraft, string>>;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<OnboardingDraft>(onboardingDraft);
  const [errors, setErrors] = useState<FieldErrors>({});

  const updateField = (field: keyof OnboardingDraft, value: string) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateCurrentStep = () => {
    const nextErrors: FieldErrors = {};
    if (step === 0) {
      if (!form.firstName.trim()) nextErrors.firstName = "Please add your first name.";
      if (!form.major.trim()) nextErrors.major = "Please add your major.";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile setup</CardTitle>
        <CardDescription>
          Short, clear answers help us generate safer and more intentional introductions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressSteps steps={onboardingSteps} currentStep={step} />

        {step === 0 ? (
          <section className="space-y-3" aria-label="Basics section">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                placeholder="Mia"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                aria-invalid={Boolean(errors.firstName)}
              />
              {errors.firstName ? <p className="text-xs text-destructive">{errors.firstName}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                placeholder="Health Sciences"
                value={form.major}
                onChange={(event) => updateField("major", event.target.value)}
                aria-invalid={Boolean(errors.major)}
              />
              {errors.major ? <p className="text-xs text-destructive">{errors.major}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="grad-year">Graduation Year (optional)</Label>
              <Input
                id="grad-year"
                placeholder="2028"
                value={form.graduationYear}
                onChange={(event) => updateField("graduationYear", event.target.value)}
              />
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
                aria-invalid={Boolean(errors.boundaries)}
              />
              {errors.boundaries ? <p className="text-xs text-destructive">{errors.boundaries}</p> : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Trust note: this helps reduce awkward or unsafe first interactions.
            </p>
          </section>
        ) : null}

        {saved ? <p className="text-xs text-muted-foreground">Draft saved locally for this session.</p> : null}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onSaveDraft}>
            Save draft
          </Button>
          {step < onboardingSteps.length - 1 ? (
            <Button onClick={onContinue}>Continue</Button>
          ) : (
            <Button onClick={validateCurrentStep}>Finish profile</Button>
          )}
        </div>
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
