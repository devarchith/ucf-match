import { OnboardingFlow } from "@/app/onboarding/onboarding-flow";
import { AppShell } from "@/components/app-shell";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { resolveServerSession } from "@/lib/auth/server-user";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await resolveServerSession();
  if (session.status === "signed_out") {
    return (
      <AppShell
        title="Build your profile"
        subtitle="Quick sections, clear progress, and save-friendly flow for busy students."
      >
        <TopNav pathname="/onboarding" />
        <SignedOutPrompt />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Build your profile"
      subtitle="Quick sections, clear progress, and save-friendly flow for busy students."
    >
      <TopNav pathname="/onboarding" />
      <OnboardingFlow />
    </AppShell>
  );
}
