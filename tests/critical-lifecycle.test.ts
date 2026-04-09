import assert from "node:assert/strict";
import test from "node:test";
import { ParticipationStatus } from "@prisma/client";
import { resolveDevAuthContext } from "@/lib/auth";
import { deriveParticipationStatusesForRerun } from "@/lib/matching";
import { buildCurrentValidMatchWhere } from "@/lib/safety";
import { preferencesInputSchema } from "@/lib/validation/preferences";
import {
  isJsonCompatible,
  questionnaireInputSchema
} from "@/lib/validation/questionnaire";
import { assertCanOptInTransition, assertParticipationTransition } from "@/lib/week";

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

test("forged auth headers are rejected without valid bearer token", () => {
  withEnv(
    {
      NODE_ENV: "development",
      DEV_AUTH_ENABLED: "true",
      DEV_AUTH_TOKEN: "real-secret",
      DEV_AUTH_USER_ID: "server-user-id",
      DEV_AUTH_UCF_EMAIL: "server@ucf.edu"
    },
    () => {
      const req = new Request("http://localhost/api/profile", {
        headers: {
          "x-user-id": "forged-user",
          "x-ucf-email": "forged@ucf.edu"
        }
      });

      assert.throws(() => resolveDevAuthContext(req), /Unauthorized/);
    }
  );
});

test("matched user cannot be downgraded by opt-in transition", () => {
  assert.throws(
    () => assertCanOptInTransition(ParticipationStatus.MATCHED),
    /Cannot opt in after being matched/
  );
});

test("rerun matching leaves no stale MATCHED participations", () => {
  const all = ["p1", "p2", "p3", "p4"];
  const selectedMatched = ["p1", "p2"];
  const result = deriveParticipationStatusesForRerun(all, selectedMatched);

  assert.deepEqual(result.matchedIds.sort(), ["p1", "p2"]);
  assert.deepEqual(result.optedInIds.sort(), ["p3", "p4"]);
});

test("preferences validation rejects empty required arrays", () => {
  const parsed = preferencesInputSchema.safeParse({
    preferredGenders: [],
    interests: []
  });
  assert.equal(parsed.success, false);
});

test("questionnaire validation accepts only JSON-compatible answers", () => {
  assert.equal(
    questionnaireInputSchema.safeParse({
      answers: { q1: "yes", q2: 2, q3: true, q4: ["a", "b"], q5: { nested: "ok" } }
    }).success,
    true
  );
  assert.equal(
    questionnaireInputSchema.safeParse({
      answers: { invalid: () => "nope" }
    }).success,
    false
  );
  assert.equal(isJsonCompatible({ a: ["x", 1, false, null] }), true);
  assert.equal(isJsonCompatible({ a: undefined }), false);
  assert.equal(questionnaireInputSchema.safeParse({ answers: {} }).success, false);
  assert.equal(
    questionnaireInputSchema.safeParse({ answers: { onlyNull: null, onlyEmpty: [] } }).success,
    false
  );
});

test("centralized weekly participation transition rules are enforced", () => {
  assert.doesNotThrow(() =>
    assertParticipationTransition(ParticipationStatus.OPTED_OUT, ParticipationStatus.OPTED_IN, "user_opt_in")
  );
  assert.doesNotThrow(() =>
    assertParticipationTransition(ParticipationStatus.OPTED_IN, ParticipationStatus.MATCHED, "matching_assign")
  );
  assert.doesNotThrow(() =>
    assertParticipationTransition(ParticipationStatus.MATCHED, ParticipationStatus.OPTED_IN, "matching_rerun")
  );
  assert.throws(() =>
    assertParticipationTransition(ParticipationStatus.MATCHED, ParticipationStatus.OPTED_IN, "user_opt_in")
  );
});

test("safety match where enforces current valid match and matchId pairing", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const withMatchId = buildCurrentValidMatchWhere("u1", "u2", now, "m123") as {
    id: string;
    week: { status: string };
    OR: unknown[];
  };
  assert.equal(withMatchId.id, "m123");
  assert.equal(withMatchId.week.status, "ACTIVE");
  assert.equal(withMatchId.OR.length, 2);

  const withoutMatchId = buildCurrentValidMatchWhere("u1", "u2", now) as {
    id?: string;
    week: { status: string };
  };
  assert.equal(withoutMatchId.id, undefined);
  assert.equal(withoutMatchId.week.status, "ACTIVE");
});
