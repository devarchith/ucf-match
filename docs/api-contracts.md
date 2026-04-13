# API Contracts (Draft)

## Current
- `GET /api/health`
  - `200 OK`
  - Response: `{ "status": "ok" }`

## Current user (dashboard)
- `GET /api/me`
  - Response `200 OK`
    - `userId: string`
    - `ucfEmail: string`
    - `isEmailVerified: boolean`
    - `profile: null | { id, userId, firstName, lastName, major, graduationYear, bio, createdAt, updatedAt }` — same shape as `GET /api/profile` when present
    - `hasQuestionnaire: boolean`
    - `hasPreferences: boolean`
  - `404` if the user row is missing: `{ "error": string }`
  - Complements `GET /api/profile` (404 when no profile) and `GET /api/weeks/current` (week + opt-in eligibility).

## Profile
- `GET /api/profile`
  - Response `200 OK` (same shape as `PUT` response)
    - `id: string`
    - `userId: string`
    - `firstName: string`
    - `lastName: string`
    - `major: string | null`
    - `graduationYear: number | null`
    - `bio: string | null`
    - `createdAt: string` (ISO-8601)
    - `updatedAt: string` (ISO-8601)
  - `404` when the user has no profile row yet: `{ "error": string }`

- `PUT /api/profile`
  - Request
    - `firstName: string`
    - `lastName: string`
    - `major?: string`
    - `graduationYear?: number`
    - `bio?: string`
  - Response `200 OK`
    - `id: string`
    - `userId: string`
    - `firstName: string`
    - `lastName: string`
    - `major: string | null`
    - `graduationYear: number | null`
    - `bio: string | null`
    - `createdAt: string` (ISO-8601)
    - `updatedAt: string` (ISO-8601)

## Questionnaire Submission
- `POST /api/questionnaire`
  - Request
    - `answers: Record<string, unknown>` — must be non-empty, JSON-serializable, and include at least one meaningful value (non-empty string, number, boolean, non-empty array/object subtree).
  - Response `200 OK`
    - `id: string`
    - `userId: string`
    - `answers: Record<string, unknown>`
    - `submittedAt: string`
    - `updatedAt: string`

## Preference Submission
- `PUT /api/preferences`
  - Request (choose one shape)
    - **Canonical**
      - `preferredGenders: string[]` — 1–10 items; each non-empty, max 40 chars after trim.
      - `interests: string[]` — 1–20 items; each non-empty, max 80 chars after trim.
      - `communicationStyle?: string` — if present, non-empty after trim, max 120 chars.
    - **Comfort sliders** (mapped server-side to canonical storage: `preferredGenders: ["any"]` plus three `interests` tags `campus-area:*`, `conversation-pace:*`, `meeting-windows:*`)
      - `campusAreaDistance: "low" | "medium" | "high"`
      - `conversationPace: "low" | "medium" | "high"`
      - `meetingWindows: "low" | "medium" | "high"`
      - `communicationStyle?: string` — same rules as canonical.
  - Response `200 OK`
    - `id: string`
    - `userId: string`
    - `preferredGenders: string[]`
    - `interests: string[]`
    - `communicationStyle: string | null`
    - `updatedAt: string`
  - Requires a verified UCF user (`403` otherwise).

## Weekly Status
- `GET /api/weeks/current`
  - Response `200 OK`
    - `week: { id: string; label: string; startDate: string; endDate: string; status: "ACTIVE" | "DRAFT" | "CLOSED" } | null`
    - `participation: { id: string | null; status: "OPTED_IN" | "OPTED_OUT" | "MATCHED"; optedInAt: string | null; updatedAt: string | null } | null`
      - When `week` is `null`, `participation` is `null`.
      - When `week` is non-null and the user has no participation row yet, `participation` is a synthetic object with `status: "OPTED_OUT"` and `id` / `optedInAt` / `updatedAt` set to `null` (same shape as a persisted row).
    - `canOptIn: boolean`
    - `reason: string | null` — when the user cannot opt in (`canOptIn` false), explains why; when they can opt in, `null`. If there is no active week, `reason` is `"No active week."` and `canOptIn` is false.
    - `activeMatch` — **always present** on `200 OK` (never omitted). Type is `null` or an object (see below).
      - When `week` is `null`, `activeMatch` is always `null`.
      - When `week` is non-null, `activeMatch` is **`null`** unless **all** of the following are true: the user has a persisted participation row for that week (`participation.id` is non-null), `participation.status` is `MATCHED`, there exists a `Match` for that week in status `PENDING` or `ACTIVE` that includes this participation, and the matched other user’s profile has a non-empty `firstName`. Otherwise `activeMatch` is **`null`** (e.g. `OPTED_IN` / `OPTED_OUT`, synthetic participation without a row, missing match row, or missing peer `firstName`).
      - When non-null, shape is:
        - `matchId: string`
        - `otherUserId: string`
        - `firstName: string`
        - `major: string | null`
        - `bio: string | null`
        - `graduationYear: number | null`
        - `sharedInterests: string[]`
        - `compatibilityReasons: string[]` (server-generated strings, capped to three items)

- `PUT /api/weeks/current/opt-in`
  - Response `200 OK`
    - `id: string`
    - `userId: string`
    - `weekId: string`
    - `status: "OPTED_IN" | "OPTED_OUT" | "MATCHED"`
    - `optedInAt: string | null`
    - `updatedAt: string`

## Match Response
- `POST /api/matches/{matchId}/response`
  - Request
    - `response: "ACCEPTED" | "DECLINED"`
  - Response `200 OK`
    - `id: string`
    - `weekId: string`
    - `status: "PENDING" | "ACTIVE" | "CLOSED"`
    - `userAResponse: "PENDING" | "ACCEPTED" | "DECLINED"`
    - `userBResponse: "PENDING" | "ACCEPTED" | "DECLINED"`
    - `updatedAt: string`
  - Domain notes
    - Caller must be one of the two users on the match; otherwise `403`.
    - If either side declines, match `status` becomes `CLOSED`. If both accept, `status` becomes `ACTIVE`.
    - Rejecting or changing response on a closed match: `409`. On an already-`ACTIVE` match, repeating the same `response` is idempotent (`200`); a different body returns `409`.

## Report / Block
- `POST /api/reports`
  - Request
    - `reportedUserId: string`
    - `weekId?: string` — optional; ignored. `weekId` on the created report is taken from the resolved match.
    - `matchId?: string` — optional disambiguator when resolving the active match between reporter and reported user.
    - `reason: "HARASSMENT" | "SPAM" | "SAFETY_CONCERN" | "OTHER"`
    - `details?: string`
  - Response `201 Created`
    - `id: string`
    - `reporterUserId: string`
    - `reportedUserId: string`
    - `matchId: string`
    - `weekId: string`
    - `reason: "HARASSMENT" | "SPAM" | "SAFETY_CONCERN" | "OTHER"`
    - `details: string | null`
    - `createdAt: string`

- `POST /api/blocks`
  - Request
    - `blockedUserId: string`
    - `reason?: string`
  - Response `201 Created`
    - `id: string`
    - `blockerUserId: string`
    - `blockedUserId: string`
    - `reason: string | null`
    - `createdAt: string`

## Error Envelopes
- Validation failures (`Zod`) return `400` with:
  - `{ "error": string, "issues": ZodIssue[] }`
- Other handled errors typically return:
  - `{ "error": string }`
- Auth operational configuration failures return:
  - `{ "error": string, "code": "AUTH_MISCONFIGURED" | "AUTH_PROVIDER_UNIMPLEMENTED" | "AUTH_PROVIDER_UNAVAILABLE" }`

## Local database seed
- Apply the database schema before the first seed. This repository may not ship SQL migrations; use `npx prisma db push` against your dev database when `prisma/migrations` is empty. Step-by-step env, auth, and HTTP checks: **`docs/local-e2e-runbook.md`**.
- `npm run db:seed` runs `prisma db seed` (`tsx prisma/seed.ts`).
- **Primary user** (the one your dev bearer token represents): set `SEED_USER_ID` / `SEED_UCF_EMAIL` to match `DEV_AUTH_USER_ID` / `DEV_AUTH_UCF_EMAIL`, or rely on the same defaults (`dev-local-user` / `devlocal@ucf.edu`).
- **Peer user** (second `@ucf.edu` account in the DB only — no separate bearer): defaults `SEED_PEER_USER_ID=dev-peer-user`, `SEED_PEER_UCF_EMAIL=peer@ucf.edu`. Used for safety/match flows once a match exists.
- **`SEED_ACTIVE_MATCH=true`**: after seeding, sets both users’ participations in the active seed week to `MATCHED` and creates a `PENDING` match between them so `POST /api/reports`, `POST /api/blocks`, and `POST /api/matches/{matchId}/response` succeed for the primary user against the peer. Without this flag, the primary user stays `OPTED_OUT` so `PUT /api/weeks/current/opt-in` can be tested; report/block will return `403` until a current valid match exists.
- Run order for full route coverage: (1) migrate DB, (2) seed without `SEED_ACTIVE_MATCH`, (3) test opt-in, (4) re-run `SEED_ACTIVE_MATCH=true npm run db:seed` to attach a dev match, (5) test reports/blocks/match response (note: primary user is then `MATCHED`, so opt-in will conflict with `409` until you reset DB or re-seed without the flag).
