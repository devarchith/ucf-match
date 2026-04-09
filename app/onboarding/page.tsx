import { AppShell } from "@/components/app-shell";
import { TopNav } from "@/components/top-nav";
import { OnboardingFlow } from "@/app/onboarding/onboarding-flow";

export default function OnboardingPage() {
  return (
    <AppShell
      title="Build your profile"
      subtitle="Quick sections, clear progress, and save-friendly flow for busy students."
    >
      <TopNav />
      <OnboardingFlow />
    </AppShell>
  );
}
