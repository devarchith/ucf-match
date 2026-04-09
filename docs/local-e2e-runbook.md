# Local API E2E (VEN)

Verify the Next.js API with **dev bearer auth**, a **real Postgres**, and the **Prisma seed**.

## Prerequisites

- Node dependencies installed (`npm ci` or `npm install`).
- PostgreSQL reachable from your machine.
- This repo currently has **no committed SQL migrations** (only `schema.prisma`). Apply the schema before seeding:

```bash
export DATABASE_URL="postgresql://USER@127.0.0.1:5432/ucf_match?schema=public"
npx prisma db push
```

Use a `DATABASE_URL` that works on your machine (password, socket, or role name — e.g. macOS Homebrew often uses your OS username, not `postgres`).

## Environment variables (API process)

Required for **dev bearer auth** (see `lib/auth/index.ts`):

| Variable | Example | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `development` | Dev auth only allowed in development. |
| `AUTH_MODE` | `dev` | Use bearer dev token (default in development if unset). |
| `DEV_AUTH_ENABLED` | `true` | Must be exactly `true` to enable dev auth. |
| `DEV_AUTH_TOKEN` | `change-me-local-only` | Secret; client sends `Authorization: Bearer <token>`. |
| `DEV_AUTH_USER_ID` | `dev-local-user` | Must match a `User.id` row (seed creates this by default). |
| `DEV_AUTH_UCF_EMAIL` | `devlocal@ucf.edu` | Must be `@ucf.edu`; must match seeded user’s `ucfEmail`. |
| `DATABASE_URL` | (your Postgres URL) | Used by Prisma in API routes. |

Seed alignment (optional overrides; otherwise seed follows `DEV_AUTH_*` for the primary user):

- `SEED_USER_ID`, `SEED_UCF_EMAIL` — primary seeded user (should match `DEV_AUTH_*`).
- `SEED_PEER_USER_ID` (default `dev-peer-user`), `SEED_PEER_UCF_EMAIL` (default `peer@ucf.edu`).
- `SEED_ACTIVE_MATCH=true` — creates a `PENDING` match between primary and peer (required for report/block/match-response success).

## Seed

```bash
export DATABASE_URL="..."
export DEV_AUTH_USER_ID=dev-local-user
export DEV_AUTH_UCF_EMAIL=devlocal@ucf.edu
npm run db:seed
```

For safety + match routes, after the opt-in smoke path (or on a throwaway DB):

```bash
SEED_ACTIVE_MATCH=true npm run db:seed
```

## Dev auth header

```
Authorization: Bearer <DEV_AUTH_TOKEN>
```

Wrong or missing token → **`401`** with body `{"error":"Unauthorized"}`.

## Start the API

From the repo root, with the same env as above:

```bash
npx next dev -p 3010 -H 127.0.0.1
```

Binding to **`127.0.0.1`** avoids some environments crashing on `os.networkInterfaces()` during startup. Use any free port; set `BASE_URL` accordingly for curls.

## Route order (recommended)

1. `GET /api/health` — no auth; expect `200` `{"status":"ok"}`.
2. `GET /api/me` — expect `200` with `userId`, `ucfEmail`, `isEmailVerified`, `profile`, `hasQuestionnaire`, `hasPreferences`.
3. `GET /api/profile` — expect `200` or `404` if no profile (seed creates one).
4. `PUT /api/profile` — JSON body with `firstName`, `lastName`, optional fields.
5. `POST /api/questionnaire` — JSON `{ "answers": { ... } }` with at least one meaningful value.
6. `PUT /api/preferences` — canonical arrays or comfort sliders (see `docs/api-contracts.md`).
7. `GET /api/weeks/current` — expect `week`, `participation`, `canOptIn`, `reason`.
8. `PUT /api/weeks/current/opt-in` — expect `200` and `status: "OPTED_IN"` when eligible.
9. `POST /api/reports` — **without** `SEED_ACTIVE_MATCH`: expect **`403`** `{"error":"Reports and blocks are only available for currently valid matches."}`. **With** seed match: expect **`201`** and report payload per contract.
10. `POST /api/blocks` — same **`403` / `201`** pattern as reports.
11. `POST /api/matches/<matchId>/response` — body `{"response":"ACCEPTED"|"DECLINED"}`; requires a match id from the DB (e.g. `SELECT id FROM "Match" ORDER BY "createdAt" DESC LIMIT 1`).

## Expected errors (contract-aligned)

| Case | Status | Body shape |
|------|--------|------------|
| Invalid JSON / Zod | `400` | `{ "error": string, "issues": [...] }` |
| Wrong dev bearer | `401` | `{ "error": "Unauthorized" }` |
| Report/block without valid match | `403` | `{ "error": string }` |
| Profile missing | `404` | `{ "error": string }` |
| User missing (rare for dev auth) | `404` on `/api/me` | `{ "error": string }` |

Full response field lists: **`docs/api-contracts.md`**.

## Automated curl helper

With **`next dev` already running**:

```bash
export BASE_URL=http://127.0.0.1:3010
export DEV_AUTH_TOKEN=your-token
# Optional — after SEED_ACTIVE_MATCH=true and you have a match id:
# export E2E_MATCH_ID=...
./scripts/local-api-e2e.sh
```

The script asserts status codes for the happy path; without `E2E_MATCH_ID` it expects **`403`** on report/block.
