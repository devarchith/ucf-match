import { QuestionnaireFlow } from "@/app/questionnaire/questionnaire-flow";
import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { SignedOutPrompt } from "@/components/signed-out-prompt";
import { TopNav } from "@/components/top-nav";
import { loadAndAssertApiIdentity } from "@/lib/api/load-and-assert-api-identity";
import { resolveServerSession } from "@/lib/auth/server-user";

export const dynamic = "force-dynamic";

export default async function QuestionnairePage() {
  const session = await resolveServerSession();
  if (session.status === "signed_out") {
    return (
      <AppShell
        title="Weekly questionnaire"
        subtitle="Short sections with progress, validation, and save-friendly flow."
      >
        <TopNav pathname="/questionnaire" />
        <SignedOutPrompt />
      </AppShell>
    );
  }

  const identityGate = await loadAndAssertApiIdentity(session.userId);
  if (!identityGate.ok) {
    const f = identityGate.failure;
    return (
      <AppShell
        title="Weekly questionnaire"
        subtitle="Short sections with progress, validation, and save-friendly flow."
      >
        <TopNav pathname="/questionnaire" />
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
      title="Weekly questionnaire"
      subtitle="Short sections with progress, validation, and save-friendly flow."
    >
      <TopNav pathname="/questionnaire" />
      <PageStateGate
        viewState="ready"
        loadingTitle="Loading this week's prompts"
        emptyTitle="No prompts this week"
        emptyDescription="Check back before the next reveal cycle."
        errorDescription="We could not load the questionnaire. Please retry shortly."
        ready={<QuestionnaireFlow />}
      />
    </AppShell>
  );
}
