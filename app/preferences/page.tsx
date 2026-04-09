import { PreferencesFlow } from "@/app/preferences/preferences-flow";
import { AppShell } from "@/components/app-shell";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
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
