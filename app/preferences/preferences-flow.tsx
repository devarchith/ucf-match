"use client";

import { useState } from "react";

import { ProgressSteps } from "@/components/progress-steps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PreferencesDraft, PreferenceLevel, preferencesDraft, preferencesSteps } from "@/lib/mock/flows";

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

export function PreferencesFlow() {
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<PreferencesDraft>(preferencesDraft);
  const [error, setError] = useState("");

  const active = stepConfig[step];
  const activeValue = form[active.field];

  const chooseLevel = (value: PreferenceLevel) => {
    setSaved(false);
    setError("");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences setup</CardTitle>
        <CardDescription>
          Set simple preference sliders now. You can update them each week before matching.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressSteps steps={preferencesSteps} currentStep={step} />

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
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
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
          <Button variant="outline" onClick={() => setSaved(true)}>
            Save draft
          </Button>
          {step < preferencesSteps.length - 1 ? (
            <Button onClick={onContinue}>Continue</Button>
          ) : (
            <Button onClick={validateStep}>Finish preferences</Button>
          )}
        </div>
        <Button
          variant="ghost"
          className="w-full"
          disabled={step === 0}
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
