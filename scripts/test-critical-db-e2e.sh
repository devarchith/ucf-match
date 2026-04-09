#!/usr/bin/env bash
set -euo pipefail

DEFAULT_TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:54329/ucf_match_test?schema=public"

if [[ -n "${TEST_DATABASE_URL:-}" && "${TEST_DATABASE_URL}" != "${DEFAULT_TEST_DATABASE_URL}" ]]; then
  echo "Using external dedicated TEST_DATABASE_URL for DB-critical gate."
  npm run test:critical:db:prepare
  npm run test:critical:db
  exit 0
fi

teardown() {
  npm run db:test:down >/dev/null 2>&1 || true
}
trap teardown EXIT

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not reachable. Start Docker Desktop (or set TEST_DATABASE_URL to a dedicated test DB) and retry."
  exit 1
fi

npm run db:test:up
npm run db:test:wait
npm run test:critical:db:prepare
npm run test:critical:db
