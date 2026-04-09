import { cn } from "@/lib/utils";
import { StepItem } from "@/lib/mock/flows";

type ProgressStepsProps = {
  steps: StepItem[];
  currentStep: number;
};

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  const total = steps.length;
  const stepNumber = currentStep + 1;
  const pct = (stepNumber / total) * 100;

  return (
    <div className="space-y-2" aria-label="Progress">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Step {stepNumber} of {total}
      </p>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={stepNumber}
        aria-valuetext={`Step ${stepNumber} of ${total}`}
      >
        <div
          className="h-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => {
          const complete = index < currentStep;
          const active = index === currentStep;
          return (
            <div
              key={step.id}
              aria-current={active ? "step" : undefined}
              className={cn(
                "rounded-md border p-2 text-xs transition-colors",
                active && "border-primary bg-primary/5 ring-1 ring-primary/30",
                complete && "border-primary/60 bg-primary/[0.07]",
                !active && !complete && "border-border opacity-80"
              )}
            >
              <p className="font-medium">
                {complete ? (
                  <span className="mr-1 text-primary" aria-hidden>
                    ✓
                  </span>
                ) : null}
                {step.label}
              </p>
              <p className="text-muted-foreground">{step.hint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
