# Release handoff: `ven/ui-shells` → `main`

## Branch state (vs `main`)

- **`ven/ui-shells` fully contains `main`:** every commit on `main` is present on this branch; **`main` has no commits that are not already on `ven/ui-shells`**. Merging this branch into `main` is a fast-forward from `main`’s perspective once it lands.
- **`ven/ui-shells` is ahead of `main`** by commits that add frontend integration (server actions, RSC data loading, auth-aware flows) and server support for the match UI.
- **`dev` is redundant if it matches `main`** (same tip SHA). In that case it is a duplicate integration line unless you rely on it for workflow. After merge, **delete `dev`** or **reset `dev` to `main`**—team preference.

## MVP ship summary

- **Release validation status:** This branch is **ready for release validation** (review and manual smoke—not a statement that merge is already approved). At the time of this handoff, **no code-level release blockers** were found in the scope reviewed below.
- **Local checks (non-authoritative):** **`npm run typecheck`** and **`npm run test:fast`** pass on this branch. They are **useful pre-merge signals only**, not a substitute for release validation. **Final merge still depends on manual smoke** and **any team-required merge gates** (branch protection and required checks are configured in GitHub, not in this repo; this repo defines workflows under `.github/workflows/`).
- **Goal:** Ship the integrated UI that calls existing Next.js route handlers (dev bearer in development) with truthful loading/error states, without changing auth policy or matching/safety **enforcement** rules in the safety/matching layers.
- **`GET /api/weeks/current` and `activeMatch` (matches implementation):** The handler returns `getCurrentWeekStatus()` JSON as-is. **`activeMatch` is always a top-level key** on success (`null` or a preview object). It is **non-null** only when there is an active week, the user’s participation is persisted with `status === "MATCHED"`, a `PENDING` or `ACTIVE` match exists for that participation, and the matched peer has a profile with a non-empty `firstName`; otherwise **`activeMatch` is `null`**. See **`docs/api-contracts.md`** for the full field list.

## Ship verdict

| Item | Status |
|------|--------|
| **READY / NOT READY** | **Ready for release validation** — no **code-level** release blockers found in this handoff’s scope; **merge** still depends on **manual smoke**, **any team-required merge gates**, and normal review. |
| **Blocking issues** | **None found** in the reviewed scope. (API response for `/api/weeks/current` **was** extended with **`activeMatch`**; see above—that is additive and non-breaking, not a blocker.) |

## Obvious release risks (observed, not speculative)

- **Scope:** This branch touches many files (UI + new `app/actions/*` + API client helpers). If `main` moved elsewhere, rebase/merge and re-run checks before merge.

## Manual smoke checklist (local)

Prerequisites: Postgres `DATABASE_URL`, `npx prisma db push`, `npm run db:seed`, dev auth env vars as in `docs/local-e2e-runbook.md`, `npm run dev`.

1. **Health:** `GET /api/health` → `200`, `{"status":"ok"}`.
2. **Auth:** Without bearer, protected routes return `401`/`503` as configured; with correct bearer, `GET /api/me` → `200`.
3. **Dashboard:** Loads without server error; week/match cards reflect API (or documented empty states).
4. **Onboarding / profile / questionnaire / preferences:** Submit flows complete and persist via server actions (no console-only mock).
5. **Weekly opt-in:** Opt-in action succeeds when eligible; handles ineligible reason copy.
6. **Match page:** When `MATCHED` with seed data, shows consistent preview; **Accept / Decline** match response actions behave per API.
7. **Report / block:** With valid match context, submissions succeed; blocked state shows correctly when applicable.
8. **Reload:** Critical pages (dashboard, match) do not show stale success after a failed action (spot-check).

## Deferred follow-ups (non-blocking)

- **Error handling consistency:** RSC vs client boundaries vs `PageStateGate`; generic `error.tsx` vs structured errors.
- **Action failure classification:** `presentClientThrownActionFailure` heuristics (network vs generic).
- **Server/client alignment:** `getServerUserId()` ordering vs parallel dashboard fetch; sessionStorage vs server truth on reload (e.g. match responded).
- **Taxonomy cleanup:** `unexpected` vs `failureClass: "unknown"`.
## PR description (paste into GitHub)

```markdown
## Summary
Proposes merging **`ven/ui-shells`** into **`main`**: MVP frontend integration (server actions, authenticated flows, dashboard/match/opt-in/report/block UX).

**Status:** This branch is **ready for release validation**—**not** a claim that merge is pre-approved. **No code-level release blockers** were found in the handoff review scope. **Local** `npm run typecheck` and `npm run test:fast` passed at handoff time; they are **non-authoritative** pre-merge signals only. **Final merge still depends on manual smoke** and **any team-required merge gates** (this repo includes `.github/workflows/`; required checks and branch protection are GitHub settings).

## Branch / API notes
- **`ven/ui-shells` fully contains `main`** (nothing on `main` that is not already on this branch).
- **`GET /api/weeks/current`:** **`activeMatch`** is **always present** on `200 OK` (`null` or a preview object). Non-null only when there is an active week, participation is persisted with **`MATCHED`**, a **`PENDING` or `ACTIVE`** match exists for that participation, and the peer profile has a non-empty **`firstName`**. See **`docs/api-contracts.md`**.
- **`dev` is redundant if it matches `main`** (same tip). Consider deleting **`dev`** or fast-forwarding it to **`main`** after merge to avoid a duplicate integration branch.

## Testing / merge gates
- [ ] **Manual smoke** (`docs/release-handoff.md` checklist)
- [ ] **Any team-required merge gates** (e.g. required checks on the PR—configure in GitHub)
- [ ] (Optional local) `npm run typecheck`, `npm run test:fast` — pre-merge signals only

## Deferred (post-merge, non-release)
- RSC / client error boundary consistency
- Action failure classification accuracy
- Server vs client state on reload (match response)
- Error taxonomy cleanup

## Risk / monitoring
- Auth mismatch edge cases
- Misclassified client errors
- Stale UI after reload
```
