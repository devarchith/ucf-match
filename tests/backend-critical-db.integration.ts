import assert from "node:assert/strict";
import test from "node:test";
import {
  MatchStatus,
  ParticipationStatus,
  WeekStatus
} from "@prisma/client";
import { createTestPrismaClient, resetTestDatabase } from "@/tests/test-db";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const hasDb = Boolean(testDatabaseUrl);

if (hasDb) {
  process.env.DATABASE_URL = testDatabaseUrl;
}

const maybeSuite = hasDb ? test : test.skip;

maybeSuite("db integration: no-pair rerun reconciles stale MATCHED/PENDING", async () => {
  const prisma = createTestPrismaClient();
  const { generateWeeklyMatches } = await import("@/lib/matching");
  try {
    await resetTestDatabase(prisma);

    const week = await prisma.week.create({
      data: {
        id: "week-no-pairs",
        label: "2026-W10-no-pairs",
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        endDate: new Date("2030-03-07T23:59:59.000Z"),
        status: WeekStatus.ACTIVE
      }
    });

    const u1 = await prisma.user.create({
      data: {
        id: "u-no-1",
        ucfEmail: "uno1@ucf.edu",
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });
    const u2 = await prisma.user.create({
      data: {
        id: "u-no-2",
        ucfEmail: "uno2@ucf.edu",
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    await prisma.profile.createMany({
      data: [
        { userId: u1.id, firstName: "A", lastName: "One" },
        { userId: u2.id, firstName: "B", lastName: "Two" }
      ]
    });
    await prisma.preference.createMany({
      data: [
        { userId: u1.id, preferredGenders: ["any"], interests: ["x"] },
        { userId: u2.id, preferredGenders: ["any"], interests: ["x"] }
      ]
    });
    await prisma.questionnaireResponse.createMany({
      data: [
        { userId: u1.id, answers: { q1: "a" } },
        { userId: u2.id, answers: { q1: "a" } }
      ]
    });

    const p1 = await prisma.weeklyParticipation.create({
      data: { userId: u1.id, weekId: week.id, status: ParticipationStatus.MATCHED }
    });
    const p2 = await prisma.weeklyParticipation.create({
      data: { userId: u2.id, weekId: week.id, status: ParticipationStatus.MATCHED }
    });

    await prisma.match.create({
      data: {
        weekId: week.id,
        participantAId: p1.id,
        participantBId: p2.id,
        status: MatchStatus.PENDING
      }
    });

    await prisma.block.create({
      data: { blockerUserId: u1.id, blockedUserId: u2.id, reason: "no match" }
    });

    const result = await generateWeeklyMatches(week.id);
    assert.equal(result.length, 0);

    const postMatches = await prisma.match.findMany({
      where: { weekId: week.id, status: MatchStatus.PENDING }
    });
    assert.equal(postMatches.length, 0);

    const postParticipations = await prisma.weeklyParticipation.findMany({
      where: { weekId: week.id },
      orderBy: { userId: "asc" }
    });
    assert.deepEqual(
      postParticipations.map((p) => p.status),
      [ParticipationStatus.OPTED_IN, ParticipationStatus.OPTED_IN]
    );
  } finally {
    await resetTestDatabase(prisma);
    await prisma.$disconnect();
  }
});

maybeSuite("db integration: stale same-week pending pair is rematchable after cleanup", async () => {
  const prisma = createTestPrismaClient();
  const { generateWeeklyMatches } = await import("@/lib/matching");
  try {
    await resetTestDatabase(prisma);

    const week = await prisma.week.create({
      data: {
        id: "week-rematch",
        label: "2026-W10-rematch",
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        endDate: new Date("2030-03-07T23:59:59.000Z"),
        status: WeekStatus.ACTIVE
      }
    });

    const [u1, u2] = await Promise.all([
      prisma.user.create({
        data: {
          id: "u-rematch-1",
          ucfEmail: "rematch1@ucf.edu",
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      }),
      prisma.user.create({
        data: {
          id: "u-rematch-2",
          ucfEmail: "rematch2@ucf.edu",
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      })
    ]);

    await prisma.profile.createMany({
      data: [
        { userId: u1.id, firstName: "Re", lastName: "One" },
        { userId: u2.id, firstName: "Re", lastName: "Two" }
      ]
    });
    await prisma.preference.createMany({
      data: [
        { userId: u1.id, preferredGenders: ["any"], interests: ["hiking"] },
        { userId: u2.id, preferredGenders: ["any"], interests: ["hiking"] }
      ]
    });
    await prisma.questionnaireResponse.createMany({
      data: [
        { userId: u1.id, answers: { q1: "x" } },
        { userId: u2.id, answers: { q1: "x" } }
      ]
    });

    const p1 = await prisma.weeklyParticipation.create({
      data: { userId: u1.id, weekId: week.id, status: ParticipationStatus.OPTED_IN }
    });
    const p2 = await prisma.weeklyParticipation.create({
      data: { userId: u2.id, weekId: week.id, status: ParticipationStatus.OPTED_IN }
    });

    await prisma.match.create({
      data: {
        weekId: week.id,
        participantAId: p1.id,
        participantBId: p2.id,
        status: MatchStatus.PENDING
      }
    });

    const created = await generateWeeklyMatches(week.id);
    assert.equal(created.length, 1);

    const pending = await prisma.match.findMany({
      where: { weekId: week.id, status: MatchStatus.PENDING }
    });
    assert.equal(pending.length, 1);

    const finalParticipations = await prisma.weeklyParticipation.findMany({
      where: { weekId: week.id },
      orderBy: { userId: "asc" }
    });
    assert.deepEqual(
      finalParticipations.map((p) => p.status),
      [ParticipationStatus.MATCHED, ParticipationStatus.MATCHED]
    );
  } finally {
    await resetTestDatabase(prisma);
    await prisma.$disconnect();
  }
});

maybeSuite("db integration: same-week ACTIVE/CLOSED match blocks rematch by policy", async () => {
  const prisma = createTestPrismaClient();
  const { generateWeeklyMatches } = await import("@/lib/matching");
  try {
    await resetTestDatabase(prisma);

    const week = await prisma.week.create({
      data: {
        id: "week-finalized-policy",
        label: "2026-W10-finalized-policy",
        startDate: new Date("2026-03-01T00:00:00.000Z"),
        endDate: new Date("2030-03-07T23:59:59.000Z"),
        status: WeekStatus.ACTIVE
      }
    });

    const [u1, u2] = await Promise.all([
      prisma.user.create({
        data: {
          id: "u-final-1",
          ucfEmail: "final1@ucf.edu",
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      }),
      prisma.user.create({
        data: {
          id: "u-final-2",
          ucfEmail: "final2@ucf.edu",
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      })
    ]);

    await prisma.profile.createMany({
      data: [
        { userId: u1.id, firstName: "Final", lastName: "One" },
        { userId: u2.id, firstName: "Final", lastName: "Two" }
      ]
    });
    await prisma.preference.createMany({
      data: [
        { userId: u1.id, preferredGenders: ["any"], interests: ["hiking"] },
        { userId: u2.id, preferredGenders: ["any"], interests: ["hiking"] }
      ]
    });
    await prisma.questionnaireResponse.createMany({
      data: [
        { userId: u1.id, answers: { q1: "x" } },
        { userId: u2.id, answers: { q1: "x" } }
      ]
    });

    const p1 = await prisma.weeklyParticipation.create({
      data: { userId: u1.id, weekId: week.id, status: ParticipationStatus.MATCHED }
    });
    const p2 = await prisma.weeklyParticipation.create({
      data: { userId: u2.id, weekId: week.id, status: ParticipationStatus.MATCHED }
    });

    await prisma.match.create({
      data: {
        weekId: week.id,
        participantAId: p1.id,
        participantBId: p2.id,
        status: MatchStatus.ACTIVE
      }
    });

    const created = await generateWeeklyMatches(week.id);
    assert.equal(created.length, 0);

    const activeMatches = await prisma.match.findMany({
      where: { weekId: week.id, status: MatchStatus.ACTIVE }
    });
    assert.equal(activeMatches.length, 1);
  } finally {
    await resetTestDatabase(prisma);
    await prisma.$disconnect();
  }
});

maybeSuite("db integration: fewer-than-2 participations still reconciles stale state", async () => {
  const prisma = createTestPrismaClient();
  const { generateWeeklyMatches } = await import("@/lib/matching");
  try {
    await resetTestDatabase(prisma);

    const week = await prisma.week.create({
      data: {
        id: "week-lt2",
        label: "2026-W11-lt2",
        startDate: new Date("2026-03-08T00:00:00.000Z"),
        endDate: new Date("2030-03-14T23:59:59.000Z"),
        status: WeekStatus.ACTIVE
      }
    });

    const u1 = await prisma.user.create({
      data: {
        id: "u-lt2-1",
        ucfEmail: "lt2_1@ucf.edu",
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });
    const u2 = await prisma.user.create({
      data: {
        id: "u-lt2-2",
        ucfEmail: "lt2_2@ucf.edu",
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    await prisma.profile.createMany({
      data: [
        { userId: u1.id, firstName: "L", lastName: "One" },
        { userId: u2.id, firstName: "L", lastName: "Two" }
      ]
    });
    await prisma.preference.createMany({
      data: [
        { userId: u1.id, preferredGenders: ["any"], interests: ["x"] },
        { userId: u2.id, preferredGenders: ["any"], interests: ["x"] }
      ]
    });
    await prisma.questionnaireResponse.createMany({
      data: [
        { userId: u1.id, answers: { q1: "a" } },
        { userId: u2.id, answers: { q1: "a" } }
      ]
    });

    const p1 = await prisma.weeklyParticipation.create({
      data: { userId: u1.id, weekId: week.id, status: ParticipationStatus.MATCHED }
    });
    const p2 = await prisma.weeklyParticipation.create({
      data: { userId: u2.id, weekId: week.id, status: ParticipationStatus.OPTED_OUT }
    });
    await prisma.match.create({
      data: {
        weekId: week.id,
        participantAId: p1.id,
        participantBId: p2.id,
        status: MatchStatus.PENDING
      }
    });

    const result = await generateWeeklyMatches(week.id);
    assert.equal(result.length, 0);

    const postPending = await prisma.match.findMany({
      where: { weekId: week.id, status: MatchStatus.PENDING }
    });
    assert.equal(postPending.length, 0);

    const postP1 = await prisma.weeklyParticipation.findUniqueOrThrow({
      where: { id: p1.id }
    });
    assert.equal(postP1.status, ParticipationStatus.OPTED_IN);
  } finally {
    await resetTestDatabase(prisma);
    await prisma.$disconnect();
  }
});

maybeSuite("db integration: opt-in vs matcher race cannot end in downgraded state", async () => {
  const prisma = createTestPrismaClient();
  const { optIntoActiveWeek } = await import("@/lib/week");
  try {
    await resetTestDatabase(prisma);

    const week = await prisma.week.create({
      data: {
        id: "week-race",
        label: "2026-W12-race",
        startDate: new Date("2026-03-15T00:00:00.000Z"),
        endDate: new Date("2030-03-21T23:59:59.000Z"),
        status: WeekStatus.ACTIVE
      }
    });

    const user = await prisma.user.create({
      data: {
        id: "u-race",
        ucfEmail: "race@ucf.edu",
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });
    await prisma.profile.create({
      data: { userId: user.id, firstName: "R", lastName: "Ace" }
    });
    await prisma.preference.create({
      data: { userId: user.id, preferredGenders: ["any"], interests: ["x"] }
    });
    await prisma.questionnaireResponse.create({
      data: { userId: user.id, answers: { q1: "a" } }
    });
    const participation = await prisma.weeklyParticipation.create({
      data: { userId: user.id, weekId: week.id, status: ParticipationStatus.OPTED_IN }
    });

    // Coordination note:
    // We use a row lock barrier (`FOR UPDATE`) so both operations target the same row
    // across real DB transactions, which credibly exercises the downgrade window.
    const barrier = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM "WeeklyParticipation"
        WHERE id = ${participation.id}
        FOR UPDATE
      `;
      await new Promise((resolve) => setTimeout(resolve, 100));
      await tx.weeklyParticipation.update({
        where: { id: participation.id },
        data: { status: ParticipationStatus.MATCHED }
      });
    });
    const optInCall = optIntoActiveWeek(user.id).catch((e: unknown) => e);

    const [_, optInResult] = await Promise.all([barrier, optInCall]);

    const final = await prisma.weeklyParticipation.findUniqueOrThrow({
      where: { id: participation.id }
    });
    assert.equal(final.status, ParticipationStatus.MATCHED);
    if (optInResult instanceof Error) {
      assert.match(optInResult.message, /matched/i);
    }
  } finally {
    await resetTestDatabase(prisma);
    await prisma.$disconnect();
  }
});

maybeSuite("db integration: semantically incomplete user is rejected from weekly eligibility", async () => {
  const prisma = createTestPrismaClient();
  const { getCurrentWeekStatus, optIntoActiveWeek } = await import("@/lib/week");
  try {
    await resetTestDatabase(prisma);

    const week = await prisma.week.create({
      data: {
        id: "week-eligibility",
        label: "2026-W13-eligibility",
        startDate: new Date("2026-03-22T00:00:00.000Z"),
        endDate: new Date("2030-03-28T23:59:59.000Z"),
        status: WeekStatus.ACTIVE
      }
    });
    void week;

    const user = await prisma.user.create({
      data: {
        id: "u-eligibility",
        ucfEmail: "eligibility@ucf.edu",
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    await prisma.profile.create({
      data: { userId: user.id, firstName: " ", lastName: " " }
    });
    await prisma.preference.create({
      data: { userId: user.id, preferredGenders: ["any"], interests: ["x"] }
    });
    await prisma.questionnaireResponse.create({
      data: { userId: user.id, answers: { onlyNull: null, onlyEmptyArray: [] } }
    });

    const status = await getCurrentWeekStatus(user.id);
    assert.equal(status.canOptIn, false);
    assert.match(status.reason ?? "", /Complete profile|questionnaire/i);

    await assert.rejects(() => optIntoActiveWeek(user.id));
  } finally {
    await resetTestDatabase(prisma);
    await prisma.$disconnect();
  }
});

maybeSuite("db integration: concurrent writer cannot bypass per-row assignment transition checks", async () => {
  const prisma = createTestPrismaClient();
  const { generateWeeklyMatches } = await import("@/lib/matching");
  try {
    await resetTestDatabase(prisma);

    const week = await prisma.week.create({
      data: {
        id: "week-concurrent-assign",
        label: "2026-W14-concurrent-assign",
        startDate: new Date("2026-03-29T00:00:00.000Z"),
        endDate: new Date("2030-04-04T23:59:59.000Z"),
        status: WeekStatus.ACTIVE
      }
    });

    const [u1, u2] = await Promise.all([
      prisma.user.create({
        data: {
          id: "u-concurrent-1",
          ucfEmail: "concurrent1@ucf.edu",
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      }),
      prisma.user.create({
        data: {
          id: "u-concurrent-2",
          ucfEmail: "concurrent2@ucf.edu",
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      })
    ]);

    await prisma.profile.createMany({
      data: [
        { userId: u1.id, firstName: "Con", lastName: "One" },
        { userId: u2.id, firstName: "Con", lastName: "Two" }
      ]
    });
    await prisma.preference.createMany({
      data: [
        { userId: u1.id, preferredGenders: ["any"], interests: ["music"] },
        { userId: u2.id, preferredGenders: ["any"], interests: ["music"] }
      ]
    });
    await prisma.questionnaireResponse.createMany({
      data: [
        { userId: u1.id, answers: { q1: "yes" } },
        { userId: u2.id, answers: { q1: "yes" } }
      ]
    });

    const p1 = await prisma.weeklyParticipation.create({
      data: { userId: u1.id, weekId: week.id, status: ParticipationStatus.OPTED_IN }
    });
    await prisma.weeklyParticipation.create({
      data: { userId: u2.id, weekId: week.id, status: ParticipationStatus.OPTED_IN }
    });

    const adversary = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM "WeeklyParticipation"
        WHERE id = ${p1.id}
        FOR UPDATE
      `;
      await new Promise((resolve) => setTimeout(resolve, 120));
      await tx.weeklyParticipation.update({
        where: { id: p1.id },
        data: { status: ParticipationStatus.OPTED_OUT }
      });
    });

    const matchingAttempt = generateWeeklyMatches(week.id);
    await Promise.all([adversary, assert.rejects(() => matchingAttempt)]);

    const post = await prisma.weeklyParticipation.findMany({
      where: { weekId: week.id },
      orderBy: { userId: "asc" }
    });
    assert.deepEqual(
      post.map((p) => p.status),
      [ParticipationStatus.OPTED_OUT, ParticipationStatus.OPTED_IN]
    );
    const pendingMatches = await prisma.match.findMany({
      where: { weekId: week.id, status: MatchStatus.PENDING }
    });
    assert.equal(pendingMatches.length, 0);
  } finally {
    await resetTestDatabase(prisma);
    await prisma.$disconnect();
  }
});

maybeSuite("db integration: mixed finalized + stale pending + extra candidates reconciles correctly", async () => {
  const prisma = createTestPrismaClient();
  const { generateWeeklyMatches } = await import("@/lib/matching");
  try {
    await resetTestDatabase(prisma);

    const week = await prisma.week.create({
      data: {
        id: "week-mixed-rerun",
        label: "2026-W15-mixed-rerun",
        startDate: new Date("2026-04-05T00:00:00.000Z"),
        endDate: new Date("2030-04-11T23:59:59.000Z"),
        status: WeekStatus.ACTIVE
      }
    });

    const users = await Promise.all(
      ["m1", "m2", "m3", "m4", "m5", "m6"].map((id) =>
        prisma.user.create({
          data: {
            id: `u-${id}`,
            ucfEmail: `${id}@ucf.edu`,
            isEmailVerified: true,
            emailVerifiedAt: new Date()
          }
        })
      )
    );

    await prisma.profile.createMany({
      data: users.map((u, idx) => ({
        userId: u.id,
        firstName: `User${idx + 1}`,
        lastName: "Mixed"
      }))
    });
    await prisma.preference.createMany({
      data: users.map((u) => ({
        userId: u.id,
        preferredGenders: ["any"],
        interests: ["hiking", "coffee"]
      }))
    });
    await prisma.questionnaireResponse.createMany({
      data: users.map((u) => ({
        userId: u.id,
        answers: { q1: "yes", q2: "weekly" }
      }))
    });

    const participations = await Promise.all(
      users.map((u, idx) =>
        prisma.weeklyParticipation.create({
          data: {
            userId: u.id,
            weekId: week.id,
            status: idx < 4 ? ParticipationStatus.MATCHED : ParticipationStatus.OPTED_IN
          }
        })
      )
    );

    const finalizedMatch = await prisma.match.create({
      data: {
        weekId: week.id,
        participantAId: participations[0].id,
        participantBId: participations[1].id,
        status: MatchStatus.ACTIVE
      }
    });

    const stalePending = await prisma.match.create({
      data: {
        weekId: week.id,
        participantAId: participations[2].id,
        participantBId: participations[3].id,
        status: MatchStatus.PENDING
      }
    });

    const created = await generateWeeklyMatches(week.id);
    assert.equal(created.length, 2);

    const activeMatches = await prisma.match.findMany({
      where: { weekId: week.id, status: MatchStatus.ACTIVE }
    });
    assert.equal(activeMatches.length, 1);
    assert.equal(activeMatches[0].id, finalizedMatch.id);

    const allPending = await prisma.match.findMany({
      where: { weekId: week.id, status: MatchStatus.PENDING },
      include: {
        participantA: { select: { userId: true } },
        participantB: { select: { userId: true } }
      }
    });
    assert.equal(allPending.length, 2);
    assert.equal(allPending.some((m) => m.id === stalePending.id), false);
    for (const pending of allPending) {
      const pendingUserIds = [pending.participantA.userId, pending.participantB.userId];
      assert.equal(
        pendingUserIds.includes(users[0].id) || pendingUserIds.includes(users[1].id),
        false
      );
    }

    const finalizedParticipants = await prisma.weeklyParticipation.findMany({
      where: { id: { in: [participations[0].id, participations[1].id] } },
      orderBy: { id: "asc" }
    });
    assert.deepEqual(
      finalizedParticipants.map((p) => p.status),
      [ParticipationStatus.MATCHED, ParticipationStatus.MATCHED]
    );

    const unlockedParticipants = await prisma.weeklyParticipation.findMany({
      where: {
        id: { in: [participations[2].id, participations[3].id, participations[4].id, participations[5].id] }
      },
      orderBy: { id: "asc" }
    });
    assert.deepEqual(
      unlockedParticipants.map((p) => p.status),
      [
        ParticipationStatus.MATCHED,
        ParticipationStatus.MATCHED,
        ParticipationStatus.MATCHED,
        ParticipationStatus.MATCHED
      ]
    );
  } finally {
    await resetTestDatabase(prisma);
    await prisma.$disconnect();
  }
});
