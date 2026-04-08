export type SafetyCheckResult = {
  allowed: boolean;
  reason?: string;
};

export function runSafetyChecks(): SafetyCheckResult {
  // Placeholder for future trust and safety checks.
  return { allowed: true };
}
