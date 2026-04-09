import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { LoadingState } from "@/components/state-block";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { resolveServerSession } from "@/lib/auth/server-user";

import { ReportFlow } from "./report-flow";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const session = await resolveServerSession();
  if (session.status === "signed_out") {
    return (
      <AppShell title="Report user" subtitle="Use this form if a conversation or match felt unsafe.">
        <TopNav />
        <SignedOutPrompt />
      </AppShell>
    );
  }

  return (
    <AppShell title="Report user" subtitle="Use this form if a conversation or match felt unsafe.">
      <TopNav />
      <Suspense fallback={<LoadingState title="Opening report form" />}>
        <ReportFlow />
      </Suspense>
    </AppShell>
  );
}
