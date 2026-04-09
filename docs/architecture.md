# Architecture
## Verification Gates
- Fast backend confidence checks run via `npm run test:fast`.
- Lifecycle/race correctness is gated by the DB-critical suite (`npm run test:critical:db`) after test DB migration.
- Local authoritative gate is `npm run test:gate` (fast + DB-critical e2e with docker-managed test DB).
- CI authoritative merge gate is `npm run test:gate:ci` using a dedicated isolated Postgres test database.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- shadcn/ui-ready config

## Structure
- `app/` for routes and API handlers
- `components/` for reusable UI
- `lib/` for domain modules (`auth`, `db`, `matching`, `safety`, `validation`)
- `prisma/` for schema and migrations
- `docs/` for product and technical docs
