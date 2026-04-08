import { db } from "@/lib/db";
import { type BlockInput } from "@/lib/validation/block";
import { type ReportInput } from "@/lib/validation/report";

export class SafetyServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function assertMatchedUsers(
  actorUserId: string,
  otherUserId: string,
  matchId?: string
) {
  if (actorUserId === otherUserId) {
    throw new SafetyServiceError("Cannot target yourself.", 400);
  }

  const where = matchId
    ? {
        id: matchId,
        OR: [
          {
            participantA: { userId: actorUserId },
            participantB: { userId: otherUserId }
          },
          {
            participantA: { userId: otherUserId },
            participantB: { userId: actorUserId }
          }
        ]
      }
    : {
        OR: [
          {
            participantA: { userId: actorUserId },
            participantB: { userId: otherUserId }
          },
          {
            participantA: { userId: otherUserId },
            participantB: { userId: actorUserId }
          }
        ]
      };

  const match = await db.match.findFirst({
    where,
    select: { id: true, weekId: true }
  });

  if (!match) {
    throw new SafetyServiceError(
      "Reports and blocks are only available for matched users.",
      403
    );
  }

  return match;
}

export async function createReport(reporterUserId: string, input: ReportInput) {
  const match = await assertMatchedUsers(
    reporterUserId,
    input.reportedUserId,
    input.matchId
  );

  const report = await db.report.create({
    data: {
      reporterUserId,
      reportedUserId: input.reportedUserId,
      matchId: match.id,
      weekId: match.weekId,
      reason: input.reason,
      details: input.details
    },
    select: {
      id: true,
      reporterUserId: true,
      reportedUserId: true,
      matchId: true,
      weekId: true,
      reason: true,
      details: true,
      createdAt: true
    }
  });

  return report;
}

export async function createBlock(blockerUserId: string, input: BlockInput) {
  await assertMatchedUsers(blockerUserId, input.blockedUserId);

  const block = await db.block.upsert({
    where: {
      blockerUserId_blockedUserId: {
        blockerUserId,
        blockedUserId: input.blockedUserId
      }
    },
    create: {
      blockerUserId,
      blockedUserId: input.blockedUserId,
      reason: input.reason
    },
    update: {
      reason: input.reason
    },
    select: {
      id: true,
      blockerUserId: true,
      blockedUserId: true,
      reason: true,
      createdAt: true
    }
  });

  return block;
}
export type SafetyCheckResult = {
  allowed: boolean;
  reason?: string;
};

export function runSafetyChecks(): SafetyCheckResult {
  // Placeholder for future trust and safety checks.
  return { allowed: true };
}
