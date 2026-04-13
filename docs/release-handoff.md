# Release handoff: `ven/ui-shells` → `main`

## Branch state (vs `main`)

- **Subset check (git, re-verify before merge):** `main` is an ancestor of this branch tip, and `git log HEAD..main` is empty—so **every commit on `main` is on `ven/ui-shells`**. If `main` gains commits elsewhere, re-run those commands.
- **`ven/ui-shells` is ahead of `main`** until merged (`git log main..HEAD` non-empty).
- **`dev`:** redundant **only when** its tip commit equals `main`’s tip. **Re-verify** with `git rev-parse main dev` (or `origin/dev`) on your clone.

## What this document is

- A **checklist and pointers**, not merge approval, not a code review record, not proof of production readiness.

## Automated commands (local, this repo)

- **Falsification pass:** **`npm run typecheck`** and **`npm run test:fast`** each exited **0** when last run for this doc revision (same working tree). **Re-run** on the merge candidate commit; exit codes depend on machine and state.
- Those scripts are **not** defined in this file as the only or mandatory release gate (`package.json` lists other scripts; see workflow file below).

## GitHub Actions (file in repo only)

- **`.github/workflows/ci.yml`** triggers on **`pull_request`** and on **push to `main`**, and runs **`npm run test:fast`** (job `fast-backend-checks`) and **`npm run test:gate:ci`** (job `db-critical-gate`). Whether any job is **required** to merge is **not** defined in this repository.

## `GET /api/weeks/current` and `activeMatch`

- **Source:** `app/api/weeks/current/route.ts` returns `getCurrentWeekStatus()` as JSON; **`lib/week/index.ts`** builds the object.
- **`activeMatch`:** On **`200 OK`**, the serialized body includes property **`activeMatch`**. Value is **`null`** or a non-null preview object per **`docs/api-contracts.md`** (non-null only under the conditions stated there—**including** persisted `MATCHED` participation, a `PENDING`/`ACTIVE` match for that participation, and non-empty peer **`firstName`** in `loadActiveMatchPreview`).

## Manual smoke (local)

**Steps only—this document does not assert they pass.**

Prerequisites: Postgres `DATABASE_URL`, `npx prisma db push`, `npm run db:seed`, dev auth env vars as in `docs/local-e2e-runbook.md`, `npm run dev`.

1. `GET /api/health` → `200`, `{"status":"ok"}`.
2. Protected routes: behavior per `lib/auth` and route handlers; with dev bearer configured, `GET /api/me` → `200` when user exists.
3. Dashboard loads for smoke setup.
4. Onboarding / profile / questionnaire / preferences: exercise flows you need for MVP.
5. Weekly opt-in: exercise per eligibility.
6. Match page / match response: exercise when seed or data provides a match.
7. Report / block: exercise when API rules allow (valid match context).
8. Reload: spot-check stale UI.

## Deferred follow-ups (non-release)

- RSC vs client error boundaries
- Action failure classification
- Server vs client state on reload
- Error taxonomy

## PR description (paste into GitHub)

```markdown
## Summary
Proposes merging **`ven/ui-shells`** into **`main`**: frontend integration (server actions, RSC-loaded pages, dashboard / match / opt-in / report / block flows).

**Not merge-approved.** This description does not record a completed review or product sign-off.

## Evidence (this repo, re-verify on PR tip)

- **Git:** `main` is contained in this branch (`git merge-base --is-ancestor main HEAD`; `git log HEAD..main` empty) **until `main` diverges**—re-run before merge.
- **Local commands:** **`npm run typecheck`** and **`npm run test:fast`** exited **0** in the falsification pass for this doc revision; **re-run** on the merge candidate.
- **Workflow file:** `.github/workflows/ci.yml` runs **`npm run test:fast`** and **`npm run test:gate:ci`** on **`pull_request`** and push to **`main`**. This repository does not define which checks are **required** to merge.

## Branch / API notes

- **`GET /api/weeks/current`:** On **`200 OK`**, JSON includes **`activeMatch`** (always a key; value `null` or preview). Non-null conditions: **`docs/api-contracts.md`** and `lib/week/index.ts` (`loadActiveMatchPreview`).

## Branches

- **`dev`:** redundant **only if** its tip equals **`main`**’s tip (verify locally).

## Testing

- [ ] Manual smoke (`docs/release-handoff.md`)
- [ ] `npm run typecheck`, `npm run test:fast` on current PR commit
- [ ] Whatever merge rules your host enforces (outside this repo)

## Deferred (post-merge)

- RSC / client error handling consistency
- Action failure classification
- Server vs client state on reload
- Error taxonomy

## Risk / monitoring

- Auth mismatch
- Misclassified errors
- Stale UI after reload
```
