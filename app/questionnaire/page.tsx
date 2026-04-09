import { AppShell } from "@/components/app-shell";
import { PageStateGate } from "@/components/page-state-gate";
import { TopNav } from "@/components/top-nav";
import { QuestionnaireFlow } from "@/app/questionnaire/questionnaire-flow";
import { questionnaireViewState } from "@/lib/mock/page-state";

export default function QuestionnairePage() {
  return (
    <AppShell
      title="Weekly questionnaire"
      subtitle="Short sections with progress, validation, and save-friendly flow."
    >
      <TopNav />
      <PageStateGate
        viewState={questionnaireViewState}
        loadingTitle="Loading this week's prompts"
        emptyTitle="No prompts this week"
        emptyDescription="Check back before the next reveal cycle."
        errorDescription="We could not load the questionnaire. Please retry shortly."
        ready={<QuestionnaireFlow />}
      />
    </AppShell>
  );
}
