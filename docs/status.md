# Project Status

## Completed
- Base project scaffold
- Core route placeholders
- Prisma initialization
- Foundational library modules
- Baseline docs

## Next
- Add auth
- Add weekly matching feature set
- Add safety workflows

## Critical DB Test Runbook
- Dedicated test DB target:
  - default URL used by scripts when `TEST_DATABASE_URL` is not set:
    - `postgresql://postgres:postgres@localhost:54329/ucf_match_test?schema=public`
  - safety rule is enforced in test helpers: URL must clearly target a test DB (name includes `test`).

- One-command local end-to-end run (recommended):
  - `npm run test:critical:db:e2e`
  - flow (default): preflight docker daemon -> start dedicated docker Postgres -> wait healthy -> apply migrations -> run DB-backed critical tests -> teardown.
  - flow (external DB): if `TEST_DATABASE_URL` is set to a non-default dedicated test DB, run prepare + DB-critical tests directly (no docker bootstrap).
  - teardown is guaranteed with shell `trap`, even when prepare/tests fail.

- Authoritative gate commands:
  - fast local/backend checks (non-authoritative for lifecycle/race): `npm run test:fast`
  - local merge gate (authoritative): `npm run test:gate`
  - CI merge gate (required + authoritative): `npm run test:gate:ci`

- Explicit step-by-step flow:
  - `npm run db:test:up`
  - `npm run db:test:wait`
  - `npm run test:critical:db:prepare`
  - `npm run test:critical:db`
  - `npm run db:test:down`

- Gate clarity:
  - `npm run test:critical:db` now runs only DB-backed critical integration tests.
  - route/auth integration checks remain in the normal `npm run test` suite.
  - DB-critical lifecycle tests are the authoritative correctness gate for lifecycle/race behavior.

## Required Verification Discipline
- Required before merge:
  - CI `fast-backend-checks` must pass.
  - CI `db-critical-gate` must pass.
  - Recommended locally before opening PR: `npm run test:gate`.

- Required before controlled MVP beta:
  - Run CI-required merge gates on the exact release commit.
  - Ensure `db-critical-gate` is green with no skipped DB-critical tests.
  - Ensure test DB target remains isolated and clearly test-only.

- Using your own test DB instead of Docker:
  - `TEST_DATABASE_URL="postgresql://.../your_test_db?schema=public" npm run test:critical:db:prepare`
  - `TEST_DATABASE_URL="postgresql://.../your_test_db?schema=public" npm run test:critical:db`

- Failure modes and exact blockers:
  - `Docker daemon is not reachable...`:
    - start Docker Desktop, then rerun `npm run test:critical:db:e2e`.
    - or provide `TEST_DATABASE_URL` for a dedicated external test DB and run prepare/test scripts directly.
  - `TEST_DATABASE_URL is required for DB integration tests`:
    - set `TEST_DATABASE_URL` or use default docker flow.
  - `Unsafe TEST_DATABASE_URL...`:
    - URL does not look like a dedicated test DB; rename/use a DB containing `test` in the name.
  - Prisma migrate/connect permission errors:
    - DB user lacks create/alter/read/write/delete rights on the test DB.
    - verify with: `psql "$TEST_DATABASE_URL" -c "select current_database(), current_user, now();"`
  - Docker readiness timeout:
    - inspect logs with `npm run db:test:logs`.
