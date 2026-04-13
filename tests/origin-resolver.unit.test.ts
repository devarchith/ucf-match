import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiOriginMisconfiguredError,
  resolveInternalApiOriginSync
} from "@/lib/api/resolve-internal-origin";

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

function headersFrom(entries: Record<string, string>) {
  const h = new Headers();
  for (const [k, v] of Object.entries(entries)) {
    h.set(k, v);
  }
  return h;
}

test("unit: production fails closed without NEXT_PUBLIC_APP_URL or VERCEL_URL", () => {
  withEnv(
    {
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: undefined
    },
    () => {
      assert.throws(
        () => resolveInternalApiOriginSync(process.env, headersFrom({ host: "localhost:3000" })),
        (err: unknown) =>
          err instanceof ApiOriginMisconfiguredError &&
          err.message.includes("NEXT_PUBLIC_APP_URL") &&
          err.message.includes("production")
      );
    }
  );
});

test("unit: development allows request-derived origin for localhost", () => {
  const url = withEnv(
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: undefined
    },
    () =>
      resolveInternalApiOriginSync(
        process.env,
        headersFrom({ host: "localhost:3000", "x-forwarded-proto": "http" })
      )
  );
  assert.equal(url, "http://localhost:3000");
});

test("unit: development allows request-derived origin for 127.0.0.1", () => {
  const url = withEnv(
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: undefined
    },
    () =>
      resolveInternalApiOriginSync(
        process.env,
        headersFrom({ host: "127.0.0.1:3010", "x-forwarded-proto": "http" })
      )
  );
  assert.equal(url, "http://127.0.0.1:3010");
});

test("unit: development allows request-derived origin for bracketed IPv6 loopback", () => {
  const url = withEnv(
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: undefined
    },
    () =>
      resolveInternalApiOriginSync(
        process.env,
        headersFrom({ host: "[::1]:3000", "x-forwarded-proto": "http" })
      )
  );
  assert.equal(url, "http://[::1]:3000");
});

test("unit: development rejects attacker-controlled Host (SSRF / bearer exfil regression)", () => {
  withEnv(
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: undefined
    },
    () => {
      assert.throws(
        () =>
          resolveInternalApiOriginSync(
            process.env,
            headersFrom({ host: "evil.example:443", "x-forwarded-proto": "https" })
          ),
        (err: unknown) =>
          err instanceof ApiOriginMisconfiguredError &&
          err.message.includes("loopback") &&
          err.message.includes("NEXT_PUBLIC_APP_URL")
      );
    }
  );
});

test("unit: development rejects non-loopback LAN IP without explicit NEXT_PUBLIC_APP_URL", () => {
  withEnv(
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: undefined
    },
    () => {
      assert.throws(
        () =>
          resolveInternalApiOriginSync(
            process.env,
            headersFrom({ host: "192.168.1.10:3000", "x-forwarded-proto": "http" })
          ),
        (err: unknown) => err instanceof ApiOriginMisconfiguredError
      );
    }
  );
});

test("unit: NEXT_PUBLIC_APP_URL bypasses request Host (trusted explicit origin)", () => {
  const url = withEnv(
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: "http://192.168.1.5:3000",
      VERCEL_URL: undefined
    },
    () =>
      resolveInternalApiOriginSync(
        process.env,
        headersFrom({ host: "evil.example", "x-forwarded-proto": "https" })
      )
  );
  assert.equal(url, "http://192.168.1.5:3000");
});

test("unit: VERCEL_URL wins over request Host (no Host trust needed)", () => {
  const url = withEnv(
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: "myapp.vercel.app"
    },
    () =>
      resolveInternalApiOriginSync(
        process.env,
        headersFrom({ host: "evil.example", "x-forwarded-proto": "https" })
      )
  );
  assert.equal(url, "https://myapp.vercel.app");
});
