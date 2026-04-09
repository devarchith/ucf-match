import { cn } from "@/lib/utils";
import { StepItem } from "@/lib/mock/flows";

type ProgressStepsProps = {
  steps: StepItem[];
  currentStep: number;
};

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="space-y-2" aria-label="Progress">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => {
          const complete = index < currentStep;
          const active = index === currentStep;
          return (
            <div
              key={step.id}
              className={cn(
                "rounded-md border p-2 text-xs",
                active && "border-primary bg-primary/5",
                complete && "border-primary/50"
              )}
            >
              <p className="font-medium">{step.label}</p>
              <p className="text-muted-foreground">{step.hint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
