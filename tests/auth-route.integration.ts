import assert from "node:assert/strict";
import test from "node:test";

test("route auth misconfiguration returns typed operational error payload", async () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_MODE: process.env.AUTH_MODE,
    AUTH_PROVIDER_ENABLED: process.env.AUTH_PROVIDER_ENABLED
  };
  try {
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = "production";
    env.AUTH_MODE = "provider";
    env.AUTH_PROVIDER_ENABLED = "false";

    const { PUT } = await import("@/app/api/weeks/current/opt-in/route");
    const res = await PUT(new Request("http://localhost/api/weeks/current/opt-in"));
    const body = (await res.json()) as { error?: string; code?: string };

    assert.equal(res.status, 503);
    assert.equal(body.code, "AUTH_MISCONFIGURED");
    assert.match(body.error ?? "", /Auth provider is not configured/i);
  } finally {
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = previous.NODE_ENV;
    env.AUTH_MODE = previous.AUTH_MODE;
    env.AUTH_PROVIDER_ENABLED = previous.AUTH_PROVIDER_ENABLED;
  }
});

test("route auth misconfiguration logs include lightweight request context", async () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_MODE: process.env.AUTH_MODE,
    AUTH_PROVIDER_ENABLED: process.env.AUTH_PROVIDER_ENABLED
  };
  const originalError = console.error;
  const captured: string[] = [];
  console.error = (message?: unknown, ...optionalParams: unknown[]) => {
    captured.push(String(message));
    if (optionalParams.length > 0) {
      captured.push(optionalParams.map((v) => String(v)).join(" "));
    }
  };

  try {
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = "production";
    env.AUTH_MODE = "provider";
    env.AUTH_PROVIDER_ENABLED = "false";

    const { PUT } = await import("@/app/api/weeks/current/opt-in/route");
    await PUT(
      new Request("http://localhost/api/weeks/current/opt-in", {
        headers: { "x-request-id": "req-123" }
      })
    );

    const joined = captured.join("\n");
    assert.match(joined, /auth_operational_failure/);
    assert.match(joined, /"route":"\/api\/weeks\/current\/opt-in"/);
    assert.match(joined, /"method":"PUT"/);
    assert.match(joined, /"requestId":"req-123"/);
  } finally {
    console.error = originalError;
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = previous.NODE_ENV;
    env.AUTH_MODE = previous.AUTH_MODE;
    env.AUTH_PROVIDER_ENABLED = previous.AUTH_PROVIDER_ENABLED;
  }
});
