import { MatchResponse as MatchResponseEnum, MatchStatus } from "@prisma/client";
import { db } from "@/lib/db";

export class MatchResponseServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function submitWeeklyMatchResponse(
  userId: string,
  matchId: string,
  response: "ACCEPTED" | "DECLINED"
) {
  const prismaResponse =
    response === "ACCEPTED" ? MatchResponseEnum.ACCEPTED : MatchResponseEnum.DECLINED;

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      weekId: true,
      status: true,
      userAResponse: true,
      userBResponse: true,
      participantA: { select: { userId: true } },
      participantB: { select: { userId: true } }
    }
  });

  if (!match) {
    throw new MatchResponseServiceError("Match not found.", 404);
  }

  if (match.status === MatchStatus.CLOSED) {
    throw new MatchResponseServiceError("Match is closed.", 409);
  }

  const isA = match.participantA.userId === userId;
  const isB = match.participantB.userId === userId;
  if (!isA && !isB) {
    throw new MatchResponseServiceError("Not a participant in this match.", 403);
  }

  if (match.status === MatchStatus.ACTIVE) {
    const current = isA ? match.userAResponse : match.userBResponse;
    if (current !== prismaResponse) {
      throw new MatchResponseServiceError("Match response already finalized.", 409);
    }
    return db.match.findUniqueOrThrow({
      where: { id: matchId },
      select: {
        id: true,
        weekId: true,
        status: true,
        userAResponse: true,
        userBResponse: true,
        updatedAt: true
      }
    });
  }

  const newAResponse = isA ? prismaResponse : match.userAResponse;
  const newBResponse = isB ? prismaResponse : match.userBResponse;

  let nextStatus: MatchStatus = match.status;
  if (newAResponse === MatchResponseEnum.DECLINED || newBResponse === MatchResponseEnum.DECLINED) {
    nextStatus = MatchStatus.CLOSED;
  } else if (newAResponse === MatchResponseEnum.ACCEPTED && newBResponse === MatchResponseEnum.ACCEPTED) {
    nextStatus = MatchStatus.ACTIVE;
  }

  return db.match.update({
    where: { id: matchId },
    data: {
      userAResponse: newAResponse,
      userBResponse: newBResponse,
      status: nextStatus
    },
    select: {
      id: true,
      weekId: true,
      status: true,
      userAResponse: true,
      userBResponse: true,
      updatedAt: true
    }
  });
}
