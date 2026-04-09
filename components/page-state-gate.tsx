import { ReactNode } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/state-block";
import { ViewState } from "@/lib/types/ui-state";

type PageStateGateProps = {
  viewState: ViewState;
  ready: ReactNode;
  loadingTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorDescription?: string;
};

export function PageStateGate({
  viewState,
  ready,
  loadingTitle = "Loading...",
  emptyTitle = "Nothing to show yet",
  emptyDescription = "This section is currently empty.",
  errorDescription = "We could not load this page state."
}: PageStateGateProps) {
  if (viewState === "loading") return <LoadingState title={loadingTitle} />;
  if (viewState === "empty") return <EmptyState title={emptyTitle} description={emptyDescription} />;
  if (viewState === "error") return <ErrorState description={errorDescription} />;
  return <>{ready}</>;
}
