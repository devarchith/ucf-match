import { MatchStatus, ParticipationStatus, WeekStatus } from "@prisma/client";
import { db } from "@/lib/db";

type MatchingFactor =
  | "sharedInterests"
  | "communicationStyle"
  | "major"
  | "graduationYear"
  | "questionnaireOverlap";

type Candidate = {
  participationAId: string;
  participationBId: string;
  userAId: string;
  userBId: string;
  score: number;
  factors: { key: MatchingFactor; points: number; detail: string }[];
  pairKey: string;
};

export type GeneratedWeeklyMatch = {
  matchId: string;
  weekId: string;
  participationAId: string;
  participationBId: string;
  userAId: string;
  userBId: string;
  score: number;
  explanationPoints: string[];
};

export class MatchingEngineError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const WEIGHTS: Record<MatchingFactor, number> = {
  sharedInterests: 45,
  communicationStyle: 20,
  major: 15,
  graduationYear: 10,
  questionnaireOverlap: 10
};

function toSet(values: string[]) {
  return new Set(
    values
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0)
  );
}

function overlapCount(a: Set<string>, b: Set<string>) {
  let count = 0;
  for (const item of a) {
    if (b.has(item)) {
      count += 1;
    }
  }
  return count;
}

function normalizeQuestionnaire(answers: unknown): Set<string> {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return new Set<string>();
  }

  const normalized = new Set<string>();
  for (const [key, value] of Object.entries(answers as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim().length > 0) {
      normalized.add(`${key}:${value.trim().toLowerCase()}`);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      normalized.add(`${key}:${String(value).toLowerCase()}`);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim().length > 0) {
          normalized.add(`${key}:${item.trim().toLowerCase()}`);
        }
      }
    }
  }
  return normalized;
}

function buildCandidate(input: {
  participationAId: string;
  participationBId: string;
  userAId: string;
  userBId: string;
  interestsA: string[];
  interestsB: string[];
  communicationStyleA: string | null;
  communicationStyleB: string | null;
  majorA: string | null;
  majorB: string | null;
  graduationYearA: number | null;
  graduationYearB: number | null;
  questionnaireA: unknown;
  questionnaireB: unknown;
}): Candidate | null {
  const factors: Candidate["factors"] = [];
  let score = 0;

  const interestsA = toSet(input.interestsA);
  const interestsB = toSet(input.interestsB);
  const sharedInterests = overlapCount(interestsA, interestsB);
  if (sharedInterests > 0) {
    const points = Math.min(WEIGHTS.sharedInterests, sharedInterests * 15);
    score += points;
    factors.push({
      key: "sharedInterests",
      points,
      detail: `${sharedInterests} shared interest${sharedInterests === 1 ? "" : "s"}`
    });
  }

  if (
    input.communicationStyleA &&
    input.communicationStyleB &&
    input.communicationStyleA.trim().toLowerCase() ===
      input.communicationStyleB.trim().toLowerCase()
  ) {
    score += WEIGHTS.communicationStyle;
    factors.push({
      key: "communicationStyle",
      points: WEIGHTS.communicationStyle,
      detail: "matching communication style"
    });
  }

  if (
    input.majorA &&
    input.majorB &&
    input.majorA.trim().toLowerCase() === input.majorB.trim().toLowerCase()
  ) {
    score += WEIGHTS.major;
    factors.push({
      key: "major",
      points: WEIGHTS.major,
      detail: "same major"
    });
  }

  if (
    input.graduationYearA &&
    input.graduationYearB &&
    Math.abs(input.graduationYearA - input.graduationYearB) <= 1
  ) {
    score += WEIGHTS.graduationYear;
    factors.push({
      key: "graduationYear",
      points: WEIGHTS.graduationYear,
      detail: "similar graduation timeline"
    });
  }

  const questionnaireA = normalizeQuestionnaire(input.questionnaireA);
  const questionnaireB = normalizeQuestionnaire(input.questionnaireB);
  const questionnaireOverlap = overlapCount(questionnaireA, questionnaireB);
  if (questionnaireOverlap > 0) {
    const points = Math.min(WEIGHTS.questionnaireOverlap, questionnaireOverlap * 2);
    score += points;
    factors.push({
      key: "questionnaireOverlap",
      points,
      detail: "aligned questionnaire responses"
    });
  }

  if (score <= 0) {
    return null;
  }

  const [firstUserId, secondUserId] = [input.userAId, input.userBId].sort();
  return {
    participationAId: input.participationAId,
    participationBId: input.participationBId,
    userAId: input.userAId,
    userBId: input.userBId,
    score,
    factors,
    pairKey: `${firstUserId}:${secondUserId}`
  };
}

export async function generateWeeklyMatches(weekId: string) {
  const week = await db.week.findUnique({
    where: { id: weekId },
    select: { id: true, status: true }
  });
  if (!week) {
    throw new MatchingEngineError("Week not found.", 404);
  }
  if (week.status !== WeekStatus.ACTIVE) {
    throw new MatchingEngineError("Week must be active for matching.", 409);
  }

  const participations = await db.weeklyParticipation.findMany({
    where: {
      weekId,
      status: ParticipationStatus.OPTED_IN
    },
    include: {
      user: {
        select: {
          id: true,
          profile: {
            select: { major: true, graduationYear: true }
          },
          preference: {
            select: { interests: true, communicationStyle: true }
          },
          questionnaire: {
            select: { answers: true }
          }
        }
      }
    },
    orderBy: { userId: "asc" }
  });

  if (participations.length < 2) {
    return [] as GeneratedWeeklyMatch[];
  }

  const userIds = participations.map((item) => item.userId);

  // Hard filters: never match blocked users or users with previous matches.
  const [blocks, historicalMatches] = await Promise.all([
    db.block.findMany({
      where: {
        OR: [{ blockerUserId: { in: userIds } }, { blockedUserId: { in: userIds } }]
      },
      select: { blockerUserId: true, blockedUserId: true }
    }),
    db.match.findMany({
      where: {
        OR: [
          { participantA: { userId: { in: userIds } } },
          { participantB: { userId: { in: userIds } } }
        ]
      },
      select: {
        participantA: { select: { userId: true } },
        participantB: { select: { userId: true } }
      }
    })
  ]);

  const blockedPairs = new Set<string>();
  for (const block of blocks) {
    const [a, b] = [block.blockerUserId, block.blockedUserId].sort();
    blockedPairs.add(`${a}:${b}`);
  }

  const historicalPairs = new Set<string>();
  for (const previous of historicalMatches) {
    const [a, b] = [previous.participantA.userId, previous.participantB.userId].sort();
    historicalPairs.add(`${a}:${b}`);
  }

  const candidates: Candidate[] = [];
  for (let i = 0; i < participations.length; i += 1) {
    for (let j = i + 1; j < participations.length; j += 1) {
      const left = participations[i];
      const right = participations[j];

      const pairKey = [left.userId, right.userId].sort().join(":");
      if (blockedPairs.has(pairKey) || historicalPairs.has(pairKey)) {
        continue;
      }

      if (
        !left.user.preference ||
        !right.user.preference ||
        !left.user.profile ||
        !right.user.profile ||
        !left.user.questionnaire ||
        !right.user.questionnaire
      ) {
        continue;
      }

      const candidate = buildCandidate({
        participationAId: left.id,
        participationBId: right.id,
        userAId: left.userId,
        userBId: right.userId,
        interestsA: left.user.preference.interests,
        interestsB: right.user.preference.interests,
        communicationStyleA: left.user.preference.communicationStyle,
        communicationStyleB: right.user.preference.communicationStyle,
        majorA: left.user.profile.major,
        majorB: right.user.profile.major,
        graduationYearA: left.user.profile.graduationYear,
        graduationYearB: right.user.profile.graduationYear,
        questionnaireA: left.user.questionnaire.answers,
        questionnaireB: right.user.questionnaire.answers
      });
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.pairKey.localeCompare(b.pairKey);
  });

  const usedParticipations = new Set<string>();
  const selected = candidates.filter((candidate) => {
    if (
      usedParticipations.has(candidate.participationAId) ||
      usedParticipations.has(candidate.participationBId)
    ) {
      return false;
    }
    usedParticipations.add(candidate.participationAId);
    usedParticipations.add(candidate.participationBId);
    return true;
  });

  if (selected.length === 0) {
    return [] as GeneratedWeeklyMatch[];
  }

  const createdMatches = await db.$transaction(async (tx) => {
    await tx.match.deleteMany({
      where: { weekId, status: MatchStatus.PENDING }
    });

    const results: GeneratedWeeklyMatch[] = [];
    for (const pick of selected) {
      const match = await tx.match.create({
        data: {
          weekId,
          participantAId: pick.participationAId,
          participantBId: pick.participationBId,
          status: MatchStatus.PENDING
        },
        select: { id: true }
      });

      await tx.weeklyParticipation.updateMany({
        where: { id: { in: [pick.participationAId, pick.participationBId] } },
        data: { status: ParticipationStatus.MATCHED }
      });

      const topFactors = [...pick.factors]
        .sort((a, b) => b.points - a.points)
        .slice(0, 3)
        .map((factor) => `${factor.detail} (+${factor.points})`);

      results.push({
        matchId: match.id,
        weekId,
        participationAId: pick.participationAId,
        participationBId: pick.participationBId,
        userAId: pick.userAId,
        userBId: pick.userBId,
        score: pick.score,
        explanationPoints: topFactors
      });
    }
    return results;
  });

  return createdMatches;
}
