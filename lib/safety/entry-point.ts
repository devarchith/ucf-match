export type SafetyEntryPoint = "match" | "conversation";

export function normalizeEntryPoint(value?: string): SafetyEntryPoint {
  if (value === "conversation") return "conversation";
  return "match";
}
