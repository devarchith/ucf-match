# Release handoff: `ven/ui-shells` → `main`

## Branch state (vs `main`)

- **`ven/ui-shells` fully contains `main`:** every commit on `main` is present on this branch; **`main` has no commits that are not already on `ven/ui-shells`**. Merging this branch into `main` is a fast-forward from `main`’s perspective once it lands.
- **`ven/ui-shells` is ahead of `main`** by commits that add frontend integration (server actions, RSC data loading, auth-aware flows) and server support for the match UI.
- **`dev` is redundant if it matches `main`** (same tip SHA). In that case it is a duplicate integration line unless you rely on it for workflow. After merge, **delete `dev`** or **reset `dev` to `main`**—team preference.

## MVP ship summary

- **MVP is ready:** **`npm run typecheck`** and **`npm run test:fast`** pass on this branch; **no release blockers found** in the checks and review summarized here.
- **Goal:** Ship the integrated UI that calls existing Next.js route handlers (dev bearer in development) with truthful loading/error states, without changing auth policy or matching/safety **enforcement** rules in the safety/matching layers.
- **HTTP response shape (explicit):** `GET /api/weeks/current` **does** include an **additive, non-breaking** top-level field **`activeMatch`** (preview when the user is `MATCHED` and data resolves). Existing fields keep prior semantics; this extends the JSON body. Strict clients must accept unknown properties or be updated to read `activeMatch`.
- **Documentation drift (not a release blocker):** `docs/api-contracts.md` has **not** been updated to list **`activeMatch`**. That is **contract doc drift only**—track as a follow-up; it does **not** block MVP merge if product accepts additive responses.

## Ship verdict

| Item | Status |
|------|--------|
| **READY / NOT READY** | **READY** — MVP is ready to merge from this handoff; no release blockers found in automated checks and the scope below. |
| **Blocking issues** | **None found.** (API response for `/api/weeks/current` **was** extended with **`activeMatch`**; see above—that is additive and non-breaking, not a blocker.) |

## Obvious release risks (observed, not speculative)

- **`docs/api-contracts.md` lags the wire format** for `GET /api/weeks/current` (missing **`activeMatch`**). This is **documentation drift**, not a release blocker, if stakeholders agree additive JSON is acceptable for MVP.
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
- **Documentation:** Add `activeMatch` to `docs/api-contracts.md` for `GET /api/weeks/current`.

## PR description (paste into GitHub)

```markdown
## Summary
Merges **`ven/ui-shells`** into **`main`**: MVP frontend integration (server actions, authenticated flows, dashboard/match/opt-in/report/block UX).

**MVP:** Ready. **No release blockers found** here; **`npm run typecheck`** and **`npm run test:fast`** pass on this branch.

## Branch / API notes
- **`ven/ui-shells` fully contains `main`** (nothing on `main` that is not already on this branch).
- **`GET /api/weeks/current`** response JSON includes an **additive, non-breaking** top-level field **`activeMatch`** (match preview when the user is `MATCHED`). This **is** a response shape extension on that route; it does not remove or rename existing fields. **`docs/api-contracts.md` has not been updated**—that is **documentation drift only**, **not** treated as a release blocker for MVP.
- **`dev` is redundant if it matches `main`** (same tip). Consider deleting **`dev`** or fast-forwarding it to **`main`** after merge to avoid a duplicate integration branch.

## Testing
- [ ] `npm run typecheck`
- [ ] `npm run test:fast`
- [ ] Manual smoke (see `docs/release-handoff.md` checklist)

## Deferred (post-merge, non-release)
- RSC / client error boundary consistency
- Action failure classification accuracy
- Server vs client state on reload (match response)
- Error taxonomy cleanup
- Update `docs/api-contracts.md` for **`activeMatch`** on `GET /api/weeks/current`

## Risk / monitoring
- Auth mismatch edge cases
- Misclassified client errors
- Stale UI after reload
```
