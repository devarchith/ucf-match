import { OnboardingFlow } from "@/app/onboarding/onboarding-flow";
import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { loadOnboardingProfileContext } from "@/lib/api/rsc-auth-context";
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

  const ctx = await loadOnboardingProfileContext(session.userId);
  if (!ctx.ok) {
    return (
      <AppShell
        title="Build your profile"
        subtitle="Quick sections, clear progress, and save-friendly flow for busy students."
      >
        <TopNav pathname="/onboarding" />
        <PageStateGate
          viewState="error"
          errorTitle={ctx.failure.title}
          errorDescription={ctx.failure.description}
          ready={null}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Build your profile"
      subtitle="Quick sections, clear progress, and save-friendly flow for busy students."
    >
      <TopNav pathname="/onboarding" />
      <OnboardingFlow initialDraft={ctx.initialDraft} />
    </AppShell>
  );
}
