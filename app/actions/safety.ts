"use server";

import { ZodError } from "zod";
import { checkServerActionApiIdentity } from "@/lib/api/assert-action-identity";
import { devBearerApiJson } from "@/lib/api/authenticated-server-client";
import { AuthError } from "@/lib/auth";
import {
  blockCreatedWireSchema,
  reportCreatedWireSchema,
  type BlockCreatedWire,
  type ReportCreatedWire
} from "@/lib/api/contracts/reports-blocks";
import {
  mapDevBearerFailure,
  unexpectedMappedActionFailure,
  type MappedActionFailure
} from "@/lib/api/map-dev-bearer-to-action";
import { SERVER_ACTION_UNAUTHORIZED } from "@/lib/auth/action-auth";
import { getServerUserId } from "@/lib/auth/server-user";
import { blockInputSchema } from "@/lib/validation/block";
import { reportInputSchema } from "@/lib/validation/report";
import { serializeZodIssues } from "@/lib/validation/zod-issues";

export type ReportActionResult = { ok: true; data: ReportCreatedWire } | MappedActionFailure;

export type BlockActionResult = { ok: true; data: BlockCreatedWire } | MappedActionFailure;

export async function submitReportAction(payload: unknown): Promise<ReportActionResult> {
  let userId: string;
  try {
    userId = await getServerUserId();
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        code: SERVER_ACTION_UNAUTHORIZED,
        message: "You are not signed in."
      };
    }
    return unexpectedMappedActionFailure(error);
  }

  const identityFailure = await checkServerActionApiIdentity(userId);
  if (identityFailure) {
    return identityFailure;
  }

  let input;
  try {
    input = reportInputSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid report data.",
        issues
      };
    }
    return unexpectedMappedActionFailure(error);
  }

  const result = await devBearerApiJson(
    "/api/reports",
    { method: "POST", body: JSON.stringify(input) },
    reportCreatedWireSchema
  );

  if (!result.ok) {
    return mapDevBearerFailure(result);
  }

  return { ok: true, data: result.data };
}

export async function submitBlockAction(payload: unknown): Promise<BlockActionResult> {
  let userId: string;
  try {
    userId = await getServerUserId();
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        code: SERVER_ACTION_UNAUTHORIZED,
        message: "You are not signed in."
      };
    }
    return unexpectedMappedActionFailure(error);
  }

  const identityFailure = await checkServerActionApiIdentity(userId);
  if (identityFailure) {
    return identityFailure;
  }

  let input;
  try {
    input = blockInputSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = serializeZodIssues(error);
      return {
        ok: false,
        message: issues[0]?.message ?? "Invalid block data.",
        issues
      };
    }
    return unexpectedMappedActionFailure(error);
  }

  const result = await devBearerApiJson(
    "/api/blocks",
    { method: "POST", body: JSON.stringify(input) },
    blockCreatedWireSchema
  );

  if (!result.ok) {
    return mapDevBearerFailure(result);
  }

  return { ok: true, data: result.data };
}
