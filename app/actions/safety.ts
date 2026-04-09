"use server";

import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";
import { SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import { getServerUserId } from "@/lib/auth/server-user";
import { SafetyServiceError, createBlock, createReport } from "@/lib/safety";
import { blockInputSchema } from "@/lib/validation/block";
import { reportInputSchema } from "@/lib/validation/report";
import { type SerializedZodIssue, serializeZodIssues } from "@/lib/validation/zod-issues";

export type ReportActionResult =
  | { ok: true; data: Awaited<ReturnType<typeof createReport>> }
  | {
      ok: false;
      message: string;
      issues?: SerializedZodIssue[];
      code?: typeof SERVER_ACTION_UNAUTHORIZED;
    };

export type BlockActionResult =
  | { ok: true; data: Awaited<ReturnType<typeof createBlock>> }
  | {
      ok: false;
      message: string;
      issues?: SerializedZodIssue[];
      code?: typeof SERVER_ACTION_UNAUTHORIZED;
    };

export async function submitReportAction(payload: unknown): Promise<ReportActionResult> {
  try {
    const userId = await getServerUserId();
    const input = reportInputSchema.parse(payload);
    const data = await createReport(userId, input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        code: SERVER_ACTION_UNAUTHORIZED,
        message: "You are not signed in."
      };
    }
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid report data.",
        issues
      };
    }
    if (error instanceof SafetyServiceError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Could not submit report. Try again." };
  }
}

export async function submitBlockAction(payload: unknown): Promise<BlockActionResult> {
  try {
    const userId = await getServerUserId();
    const input = blockInputSchema.parse(payload);
    const data = await createBlock(userId, input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        code: SERVER_ACTION_UNAUTHORIZED,
        message: "You are not signed in."
      };
    }
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid block data.",
        issues
      };
    }
    if (error instanceof SafetyServiceError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Could not block user. Try again." };
  }
}
