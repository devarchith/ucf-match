import { PreferencesFlow } from "@/app/preferences/preferences-flow";
import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { loadAndAssertApiIdentity } from "@/lib/api/load-and-assert-api-identity";
import { resolveServerSession } from "@/lib/auth/server-user";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const session = await resolveServerSession();
  if (session.status === "signed_out") {
    return (
      <AppShell
        title="Preferences"
        subtitle="Set comfort preferences in short steps with clear progress and validation."
      >
        <TopNav pathname="/preferences" />
        <SignedOutPrompt />
      </AppShell>
    );
  }

  const identityGate = await loadAndAssertApiIdentity(session.userId);
  if (!identityGate.ok) {
    const f = identityGate.failure;
    return (
      <AppShell
        title="Preferences"
        subtitle="Set comfort preferences in short steps with clear progress and validation."
      >
        <TopNav pathname="/preferences" />
        <PageStateGate
          viewState="error"
          errorTitle={f.title}
          errorDescription={f.description}
          ready={null}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Preferences"
      subtitle="Set comfort preferences in short steps with clear progress and validation."
    >
      <TopNav pathname="/preferences" />
      <PreferencesFlow />
    </AppShell>
  );
}
