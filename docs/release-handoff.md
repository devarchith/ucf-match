# Release handoff: `ven/ui-shells` → `main`

## Branch state (vs `main`)

- **`ven/ui-shells` is ahead of `main`** by commits that add frontend integration (server actions, RSC data loading, auth-aware flows) and **additive** weekly status data for the match UI.
- **`main` has no commits that are not already on `ven/ui-shells`** (merge is a fast-forward from `main`’s perspective once this branch lands).
- **`origin/dev` matches `origin/main`** at the same SHA in this repo snapshot; **`dev` is redundant** as a second integration branch unless you use it for a different workflow. Safe options after merge: **delete `dev`**, or **reset `dev` to `main`** to avoid confusion—team preference.

## MVP ship summary

- **Goal:** Ship the integrated UI shell that calls existing Next.js APIs (dev bearer in development) with truthful loading/error states, without changing auth policy or matching/safety **rules** in the enforcement layer.
- **Automated checks on this branch:** `npm run typecheck` and `npm run test:fast` both pass.
- **Additive API note:** `GET /api/weeks/current` responses now include an optional **`activeMatch`** preview object (when the user is `MATCHED` and data is available). This is **additive** JSON; clients that ignore unknown fields remain compatible. **`docs/api-contracts.md` does not yet list `activeMatch`**—update that doc in a follow-up if you treat the markdown file as the source of truth.

## Ship verdict

| Item | Status |
|------|--------|
| **READY / NOT READY** | **READY** (no failing tests or type errors observed; no blocking defect found in code review scope below) |
| **Blocking issues** | **None found** from current checks and diff review |

## Obvious release risks (observed, not speculative)

- **Contract documentation drift:** `activeMatch` on `GET /api/weeks/current` is implemented in `lib/week/index.ts` and returned by `app/api/weeks/current/route.ts` but is **not** described in `docs/api-contracts.md` yet.
- **Scope:** This branch touches many files (UI + new `app/actions/*` + API client helpers). Merge conflicts are possible if `main` was advanced elsewhere—rebase/merge and re-run checks before merge.

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
- **Documentation:** Add `activeMatch` to `docs/api-contracts.md` for `GET /api/weeks/current`.

## PR description (paste into GitHub)

```markdown
## Summary
Merges **`ven/ui-shells`** into **`main`**: frontend integration for MVP (server actions, authenticated flows, dashboard/match/opt-in/report/block UX) aligned with current API contracts.

**MVP:** Not blocked by known issues; **`npm run typecheck`** and **`npm run test:fast`** pass on this branch.

## Branch / integration notes
- **`dev` is redundant** if it matches **`main`** (same tip); consider deleting or fast-forwarding **`dev`** after merge to avoid duplicate branches.
- **Additive JSON:** `GET /api/weeks/current` may include **`activeMatch`** (preview when `MATCHED`). See `docs/release-handoff.md`.

## Testing
- [ ] `npm run typecheck`
- [ ] `npm run test:fast`
- [ ] Manual smoke (see `docs/release-handoff.md` checklist)

## Deferred (post-merge, non-release)
- RSC / client error boundary consistency
- Action failure classification accuracy
- Server vs client state on reload (match response)
- Error taxonomy cleanup
- Update `docs/api-contracts.md` for `activeMatch` on weekly current

## Risk / monitoring
- Auth mismatch edge cases
- Misclassified client errors
- Stale UI after reload
```
