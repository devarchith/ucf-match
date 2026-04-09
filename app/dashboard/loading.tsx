import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/state-block";

export default function Loading() {
  return (
    <AppShell title="Dashboard" subtitle="Loading dashboard...">
      <LoadingState title="Fetching your weekly status" />
    </AppShell>
  );
}
