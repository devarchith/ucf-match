import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/state-block";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { resolveServerSession } from "@/lib/auth/server-user";

import { BlockFlow } from "./block-flow";

export const dynamic = "force-dynamic";

export default async function BlockPage() {
  const session = await resolveServerSession();
  if (session.status === "signed_out") {
    return (
      <AppShell title="Block user" subtitle="Block removes this person from your weekly experience.">
        <TopNav />
        <SignedOutPrompt />
      </AppShell>
    );
  }

  return (
    <AppShell title="Block user" subtitle="Block removes this person from your weekly experience.">
      <TopNav />
      <Suspense fallback={<LoadingState title="Opening block confirmation" />}>
        <BlockFlow />
      </Suspense>
    </AppShell>
  );
}
