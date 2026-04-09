import { ViewState } from "@/lib/types/ui-state";

export const dashboardViewState: ViewState = "ready";
export const questionnaireViewState: ViewState = "ready";
export const pendingViewState: ViewState = "ready";
export const matchViewState: ViewState = "ready";
export const reportViewState: ViewState = "ready";
export const blockViewState: ViewState = "ready";

// Derived compatibility map only. Per-page constants are the primary ownership/usage surface.
export const pageViewState = {
  dashboard: dashboardViewState,
  questionnaire: questionnaireViewState,
  pending: pendingViewState,
  match: matchViewState,
  report: reportViewState,
  block: blockViewState
} as const;
