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
    <AppShell title="Reveal unavailable" subtitle="We hit an issue loading your match.">
      <ErrorState description="Match reveal failed to load. Try again shortly." />
      <Button onClick={reset}>Retry reveal</Button>
    </AppShell>
  );
}
