export type SafetyEntryPoint = "match" | "conversation";

export type ReportReason = {
  id: string;
  label: string;
};

export const reportReasons: ReportReason[] = [
  { id: "harassment", label: "Harassment or threatening behavior" },
  { id: "impersonation", label: "Fake identity or impersonation" },
  { id: "unsafe-request", label: "Unsafe or inappropriate request" },
  { id: "spam", label: "Spam or repeated unwanted contact" },
  { id: "other", label: "Something else" }
];

export function normalizeEntryPoint(value?: string): SafetyEntryPoint {
  if (value === "conversation") return "conversation";
  return "match";
}
