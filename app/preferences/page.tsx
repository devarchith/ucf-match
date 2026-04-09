import { AppShell } from "@/components/app-shell";
import { TopNav } from "@/components/top-nav";
import { PreferencesFlow } from "@/app/preferences/preferences-flow";

export default function PreferencesPage() {
  return (
    <AppShell
      title="Preferences"
      subtitle="Set comfort preferences in short steps with clear progress and validation."
    >
      <TopNav />
      <PreferencesFlow />
    </AppShell>
  );
}
