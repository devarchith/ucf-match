import type { ZodError } from "zod";

export type SerializedZodIssue = {
  path: string;
  message: string;
};

export function serializeZodIssues(error: ZodError): SerializedZodIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.length ? issue.path.map(String).join(".") : "_root",
    message: issue.message
  }));
}

export function issuesByPath(issues: SerializedZodIssue[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of issues) {
    if (!(row.path in map)) {
      map[row.path] = row.message;
    }
  }
  return map;
}

/** Shown when a server action fetch fails (offline, proxy error, etc.). */
export const NETWORK_ERROR_MESSAGE =
  "Could not reach the server. Check your connection and try again.";
