import assert from "node:assert/strict";
import test from "node:test";
import { ParticipationStatus, WeekStatus } from "@prisma/client";
import {
  AuthError,
  AuthOperationalError,
  requireAuthAsync
} from "@/lib/auth";
import { db } from "@/lib/db";
import { generateWeeklyMatches } from "@/lib/matching";
import { WeekServiceError, optIntoActiveWeek } from "@/lib/week";

function withEnv<T>(vars: Record<string, string | undefined>, run: () => T): T {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return run();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function withDbMock<T>(setup: (mockDb: typeof db) => void, run: () => Promise<T>) {
  const original: Record<string, unknown> = {};
  const mutableDb = db as unknown as Record<string, unknown>;
  for (const key of Object.keys(mutableDb)) {
    original[key] = mutableDb[key];
  }
  setup(db);
  return run().finally(() => {
    for (const [key, value] of Object.entries(original)) {
      mutableDb[key] = value;
    }
  });
}

test("unit: rerun with zero selected pairs clears stale MATCHED/PENDING state", async () => {
  const updateCalls: Array<Record<string, unknown>> = [];
  const deleteCalls: Array<Record<string, unknown>> = [];

  await withDbMock(
    (mockDb) => {
      (mockDb.week as any) = {
        findUnique: async () => ({ id: "w1", status: WeekStatus.ACTIVE })
      };
      (mockDb.weeklyParticipation as any) = {
        findMany: async () => [
          {
            id: "p1",
            userId: "u1",
            user: { profile: null, preference: null, questionnaire: null }
          },
          {
            id: "p2",
            userId: "u2",
            user: { profile: null, preference: null, questionnaire: null }
          }
        ]
      };
      (mockDb.block as any) = { findMany: async () => [] };
      (mockDb.match as any) = { findMany: async () => [] };
      (mockDb.$transaction as any) = async (cb: (tx: any) => Promise<unknown>) =>
        cb({
          weeklyParticipation: {
            findMany: async () => [
              { id: "p1", status: ParticipationStatus.MATCHED },
              { id: "p2", status: ParticipationStatus.MATCHED }
            ],
            updateMany: async (args: Record<string, unknown>) => {
              updateCalls.push(args);
              return { count: 1 };
            }
          },
          match: {
            deleteMany: async (args: Record<string, unknown>) => {
              deleteCalls.push(args);
              return { count: 1 };
            },
            create: async () => {
              throw new Error("should not create matches when zero selected");
            }
          }
        });
    },
    async () => {
      const result = await generateWeeklyMatches("w1");
      assert.deepEqual(result, []);
    }
  );

  assert.equal(updateCalls.length >= 1, true);
  assert.equal(deleteCalls.length, 1);
});

test("unit: rerun with fewer than 2 eligible participations still reconciles stale state", async () => {
  const updateCalls: Array<Record<string, unknown>> = [];
  const deleteCalls: Array<Record<string, unknown>> = [];

  await withDbMock(
    (mockDb) => {
      (mockDb.week as any) = {
        findUnique: async () => ({ id: "w2", status: WeekStatus.ACTIVE })
      };
      (mockDb.weeklyParticipation as any) = {
        findMany: async () => [
          {
            id: "p9",
            userId: "u9",
            user: { profile: null, preference: null, questionnaire: null }
          }
        ]
      };
      (mockDb.block as any) = { findMany: async () => [] };
      (mockDb.match as any) = { findMany: async () => [] };
      (mockDb.$transaction as any) = async (cb: (tx: any) => Promise<unknown>) =>
        cb({
          weeklyParticipation: {
            findMany: async () => [{ id: "p9", status: ParticipationStatus.MATCHED }],
            updateMany: async (args: Record<string, unknown>) => {
              updateCalls.push(args);
              return { count: 1 };
            }
          },
          match: {
            deleteMany: async (args: Record<string, unknown>) => {
              deleteCalls.push(args);
              return { count: 1 };
            },
            create: async () => {
              throw new Error("should not create matches when <2 participants");
            }
          }
        });
    },
    async () => {
      const result = await generateWeeklyMatches("w2");
      assert.deepEqual(result, []);
    }
  );

  assert.equal(updateCalls.length >= 1, true);
  assert.equal(deleteCalls.length, 1);
});

test("unit: MATCHED cannot be downgraded by opt-in under race", async () => {
  await withDbMock(
    (mockDb) => {
      (mockDb.week as any) = {
        findFirst: async () => ({ id: "w3", status: WeekStatus.ACTIVE })
      };
      (mockDb.user as any) = {
        findUnique: async () => ({
          id: "u1",
          ucfEmail: "student@ucf.edu",
          isEmailVerified: true,
          profile: { id: "p", firstName: "Unit", lastName: "User" },
          questionnaire: { id: "q", answers: { q1: "a" } },
          preference: { id: "pref", preferredGenders: ["any"], interests: ["x"] }
        })
      };
      (mockDb.$transaction as any) = async (cb: (tx: any) => Promise<unknown>) =>
        cb({
          weeklyParticipation: {
            updateMany: async () => ({ count: 0 }),
            findUnique: async () => ({ status: ParticipationStatus.MATCHED }),
            create: async () => {
              throw new Error("must not create during matched downgrade race");
            },
            findUniqueOrThrow: async () => {
              throw new Error("must not return success during matched downgrade race");
            }
          }
        });
    },
    async () => {
      await assert.rejects(
        () => optIntoActiveWeek("u1"),
        (error: unknown) =>
          error instanceof WeekServiceError &&
          /Cannot opt in after being matched/.test(error.message)
      );
    }
  );
});

test("auth mode: local dev explicit dev auth works only when enabled", async () => {
  await withEnv(
    {
      NODE_ENV: "development",
      AUTH_MODE: "dev",
      DEV_AUTH_ENABLED: "true",
      DEV_AUTH_TOKEN: "dev-token",
      DEV_AUTH_USER_ID: "local-user",
      DEV_AUTH_UCF_EMAIL: "local@ucf.edu"
    },
    async () => {
      const req = new Request("http://localhost/api/x", {
        headers: { authorization: "Bearer dev-token", "x-user-id": "forged" }
      });
      const auth = await requireAuthAsync(req);
      assert.equal(auth.userId, "local-user");
      assert.equal(auth.ucfEmail, "local@ucf.edu");
    }
  );
});

test("auth mode: staging cannot use broad shared dev auth", async () => {
  await withEnv(
    {
      NODE_ENV: "staging",
      AUTH_MODE: "dev",
      DEV_AUTH_ENABLED: "true",
      DEV_AUTH_TOKEN: "dev-token",
      DEV_AUTH_USER_ID: "u",
      DEV_AUTH_UCF_EMAIL: "u@ucf.edu"
    },
    async () => {
      const req = new Request("http://localhost/api/x", {
        headers: { authorization: "Bearer dev-token" }
      });
      await assert.rejects(
        () => requireAuthAsync(req),
        (error: unknown) => error instanceof AuthOperationalError
      );
    }
  );
});

test("auth mode: production without auth config fails closed with typed error", async () => {
  await withEnv(
    {
      NODE_ENV: "production",
      AUTH_MODE: "provider",
      AUTH_PROVIDER_ENABLED: "false"
    },
    async () => {
      const req = new Request("http://localhost/api/x");
      await assert.rejects(
        () => requireAuthAsync(req),
        (error: unknown) => error instanceof AuthOperationalError
      );
    }
  );
});

test("auth mode: forged identity headers are rejected as auth", async () => {
  await withEnv(
    {
      NODE_ENV: "development",
      AUTH_MODE: "dev",
      DEV_AUTH_ENABLED: "true",
      DEV_AUTH_TOKEN: "real-token",
      DEV_AUTH_USER_ID: "server-user",
      DEV_AUTH_UCF_EMAIL: "server@ucf.edu"
    },
    async () => {
      const req = new Request("http://localhost/api/x", {
        headers: {
          "x-user-id": "forged-user",
          "x-ucf-email": "forged@ucf.edu"
        }
      });
      await assert.rejects(
        () => requireAuthAsync(req),
        (error: unknown) => error instanceof AuthError
      );
    }
  );
});
