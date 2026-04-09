import assert from "node:assert/strict";
import test from "node:test";
import { db } from "@/lib/db";

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

test("contract: weekly current route returns expected top-level shape", async () => {
  const env = process.env as Record<string, string | undefined>;
  const previous = {
    NODE_ENV: env.NODE_ENV,
    AUTH_MODE: env.AUTH_MODE,
    DEV_AUTH_ENABLED: env.DEV_AUTH_ENABLED,
    DEV_AUTH_TOKEN: env.DEV_AUTH_TOKEN,
    DEV_AUTH_USER_ID: env.DEV_AUTH_USER_ID,
    DEV_AUTH_UCF_EMAIL: env.DEV_AUTH_UCF_EMAIL
  };

  try {
    env.NODE_ENV = "development";
    env.AUTH_MODE = "dev";
    env.DEV_AUTH_ENABLED = "true";
    env.DEV_AUTH_TOKEN = "route-token";
    env.DEV_AUTH_USER_ID = "route-user";
    env.DEV_AUTH_UCF_EMAIL = "route@ucf.edu";

    await withDbMock(
      (mockDb) => {
        (mockDb.week as unknown as { findFirst: unknown }).findFirst = async () => null;
        (mockDb.user as unknown as { findUnique: unknown }).findUnique = async () => ({
          id: "route-user",
          ucfEmail: "route@ucf.edu",
          isEmailVerified: true,
          profile: { id: "p", firstName: "Route", lastName: "User" },
          questionnaire: { id: "q", answers: { a: "b" } },
          preference: { id: "pref", preferredGenders: ["any"], interests: ["x"] }
        });
      },
      async () => {
        const { GET } = await import("@/app/api/weeks/current/route");
        const res = await GET(
          new Request("http://localhost/api/weeks/current", {
            headers: { authorization: "Bearer route-token" }
          })
        );
        const body = (await res.json()) as Record<string, unknown>;
        assert.equal(res.status, 200);
        assert.equal(typeof body.canOptIn, "boolean");
        assert.equal("week" in body, true);
        assert.equal("participation" in body, true);
      }
    );
  } finally {
    env.NODE_ENV = previous.NODE_ENV;
    env.AUTH_MODE = previous.AUTH_MODE;
    env.DEV_AUTH_ENABLED = previous.DEV_AUTH_ENABLED;
    env.DEV_AUTH_TOKEN = previous.DEV_AUTH_TOKEN;
    env.DEV_AUTH_USER_ID = previous.DEV_AUTH_USER_ID;
    env.DEV_AUTH_UCF_EMAIL = previous.DEV_AUTH_UCF_EMAIL;
  }
});

test("contract: report route returns expected response fields", async () => {
  const env = process.env as Record<string, string | undefined>;
  const previous = {
    NODE_ENV: env.NODE_ENV,
    AUTH_MODE: env.AUTH_MODE,
    DEV_AUTH_ENABLED: env.DEV_AUTH_ENABLED,
    DEV_AUTH_TOKEN: env.DEV_AUTH_TOKEN,
    DEV_AUTH_USER_ID: env.DEV_AUTH_USER_ID,
    DEV_AUTH_UCF_EMAIL: env.DEV_AUTH_UCF_EMAIL
  };

  try {
    env.NODE_ENV = "development";
    env.AUTH_MODE = "dev";
    env.DEV_AUTH_ENABLED = "true";
    env.DEV_AUTH_TOKEN = "report-token";
    env.DEV_AUTH_USER_ID = "report-user";
    env.DEV_AUTH_UCF_EMAIL = "report@ucf.edu";

    await withDbMock(
      (mockDb) => {
        (mockDb.match as unknown as { findFirst: unknown }).findFirst = async () => ({
          id: "m1",
          weekId: "w1"
        });
        (mockDb.report as unknown as { create: unknown }).create = async () => ({
          id: "r1",
          reporterUserId: "report-user",
          reportedUserId: "u2",
          matchId: "m1",
          weekId: "w1",
          reason: "OTHER",
          details: null,
          createdAt: new Date().toISOString()
        });
      },
      async () => {
        const { POST } = await import("@/app/api/reports/route");
        const res = await POST(
          new Request("http://localhost/api/reports", {
            method: "POST",
            headers: {
              authorization: "Bearer report-token",
              "content-type": "application/json"
            },
            body: JSON.stringify({
              reportedUserId: "u2",
              reason: "OTHER"
            })
          })
        );
        const body = (await res.json()) as Record<string, unknown>;
        assert.equal(res.status, 201);
        assert.equal(typeof body.id, "string");
        assert.equal(typeof body.reporterUserId, "string");
        assert.equal(typeof body.reportedUserId, "string");
        assert.equal(typeof body.matchId, "string");
        assert.equal(typeof body.weekId, "string");
        assert.equal(typeof body.reason, "string");
        assert.equal("createdAt" in body, true);
      }
    );
  } finally {
    env.NODE_ENV = previous.NODE_ENV;
    env.AUTH_MODE = previous.AUTH_MODE;
    env.DEV_AUTH_ENABLED = previous.DEV_AUTH_ENABLED;
    env.DEV_AUTH_TOKEN = previous.DEV_AUTH_TOKEN;
    env.DEV_AUTH_USER_ID = previous.DEV_AUTH_USER_ID;
    env.DEV_AUTH_UCF_EMAIL = previous.DEV_AUTH_UCF_EMAIL;
  }
});

test("contract: me GET returns expected top-level shape", async () => {
  const env = process.env as Record<string, string | undefined>;
  const previous = {
    NODE_ENV: env.NODE_ENV,
    AUTH_MODE: env.AUTH_MODE,
    DEV_AUTH_ENABLED: env.DEV_AUTH_ENABLED,
    DEV_AUTH_TOKEN: env.DEV_AUTH_TOKEN,
    DEV_AUTH_USER_ID: env.DEV_AUTH_USER_ID,
    DEV_AUTH_UCF_EMAIL: env.DEV_AUTH_UCF_EMAIL
  };

  try {
    env.NODE_ENV = "development";
    env.AUTH_MODE = "dev";
    env.DEV_AUTH_ENABLED = "true";
    env.DEV_AUTH_TOKEN = "me-get-token";
    env.DEV_AUTH_USER_ID = "me-user";
    env.DEV_AUTH_UCF_EMAIL = "me@ucf.edu";

    await withDbMock(
      (mockDb) => {
        (mockDb.user as unknown as { findUnique: unknown }).findUnique = async () => ({
          id: "me-user",
          ucfEmail: "me@ucf.edu",
          isEmailVerified: true,
          profile: {
            id: "p1",
            userId: "me-user",
            firstName: "M",
            lastName: "E",
            major: null,
            graduationYear: null,
            bio: null,
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-02T00:00:00.000Z")
          },
          questionnaire: { id: "q1" },
          preference: { id: "pr1" }
        });
      },
      async () => {
        const { GET } = await import("@/app/api/me/route");
        const res = await GET(
          new Request("http://localhost/api/me", {
            headers: { authorization: "Bearer me-get-token" }
          })
        );
        const body = (await res.json()) as Record<string, unknown>;
        assert.equal(res.status, 200);
        assert.equal(body.userId, "me-user");
        assert.equal(body.ucfEmail, "me@ucf.edu");
        assert.equal(body.isEmailVerified, true);
        assert.equal(body.hasQuestionnaire, true);
        assert.equal(body.hasPreferences, true);
        assert.equal(typeof body.profile, "object");
      }
    );
  } finally {
    env.NODE_ENV = previous.NODE_ENV;
    env.AUTH_MODE = previous.AUTH_MODE;
    env.DEV_AUTH_ENABLED = previous.DEV_AUTH_ENABLED;
    env.DEV_AUTH_TOKEN = previous.DEV_AUTH_TOKEN;
    env.DEV_AUTH_USER_ID = previous.DEV_AUTH_USER_ID;
    env.DEV_AUTH_UCF_EMAIL = previous.DEV_AUTH_UCF_EMAIL;
  }
});

test("contract: profile GET returns expected response fields", async () => {
  const env = process.env as Record<string, string | undefined>;
  const previous = {
    NODE_ENV: env.NODE_ENV,
    AUTH_MODE: env.AUTH_MODE,
    DEV_AUTH_ENABLED: env.DEV_AUTH_ENABLED,
    DEV_AUTH_TOKEN: env.DEV_AUTH_TOKEN,
    DEV_AUTH_USER_ID: env.DEV_AUTH_USER_ID,
    DEV_AUTH_UCF_EMAIL: env.DEV_AUTH_UCF_EMAIL
  };

  try {
    env.NODE_ENV = "development";
    env.AUTH_MODE = "dev";
    env.DEV_AUTH_ENABLED = "true";
    env.DEV_AUTH_TOKEN = "profile-get-token";
    env.DEV_AUTH_USER_ID = "profile-user";
    env.DEV_AUTH_UCF_EMAIL = "profile@ucf.edu";

    await withDbMock(
      (mockDb) => {
        (mockDb.profile as unknown as { findUnique: unknown }).findUnique = async () => ({
          id: "prof1",
          userId: "profile-user",
          firstName: "Pro",
          lastName: "File",
          major: "CS",
          graduationYear: 2026,
          bio: "hi",
          createdAt: new Date("2020-01-01T00:00:00.000Z"),
          updatedAt: new Date("2020-01-02T00:00:00.000Z")
        });
      },
      async () => {
        const { GET } = await import("@/app/api/profile/route");
        const res = await GET(
          new Request("http://localhost/api/profile", {
            headers: { authorization: "Bearer profile-get-token" }
          })
        );
        const body = (await res.json()) as Record<string, unknown>;
        assert.equal(res.status, 200);
        assert.equal(body.userId, "profile-user");
        assert.equal(typeof body.createdAt, "string");
        assert.equal(typeof body.updatedAt, "string");
      }
    );
  } finally {
    env.NODE_ENV = previous.NODE_ENV;
    env.AUTH_MODE = previous.AUTH_MODE;
    env.DEV_AUTH_ENABLED = previous.DEV_AUTH_ENABLED;
    env.DEV_AUTH_TOKEN = previous.DEV_AUTH_TOKEN;
    env.DEV_AUTH_USER_ID = previous.DEV_AUTH_USER_ID;
    env.DEV_AUTH_UCF_EMAIL = previous.DEV_AUTH_UCF_EMAIL;
  }
});
