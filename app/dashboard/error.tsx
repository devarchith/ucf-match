"use client";

import { AppShell } from "@/components/app-shell";
import { ErrorState } from "@/components/state-block";
import { Button } from "@/components/ui/button";

export default function Error({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell title="Dashboard error" subtitle="Something interrupted this view.">
      <ErrorState description="Unable to load dashboard details. Please retry." />
      <Button onClick={reset}>Try again</Button>
    </AppShell>
  );
}
