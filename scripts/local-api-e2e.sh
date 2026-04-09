#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
TOKEN="${DEV_AUTH_TOKEN:?Set DEV_AUTH_TOKEN (same as server)}"
AUTH=( -H "Authorization: Bearer ${TOKEN}" )
MID="${E2E_MATCH_ID:-}"

die() {
  echo "E2E FAIL: $*" >&2
  exit 1
}

code_body() {
  local url=$1
  shift
  local c
  c=$(curl -sS -o /tmp/e2e_body.json -w '%{http_code}' "$url" "$@")
  echo "$c"
}

expect_code() {
  local got=$1
  local want=$2
  local label=$3
  [[ "$got" == "$want" ]] || die "$label: expected HTTP $want, got $got — $(cat /tmp/e2e_body.json)"
}

echo "== Health (no auth) =="
c=$(code_body "${BASE_URL}/api/health")
expect_code "$c" 200 "health"
grep -q '"status":"ok"' /tmp/e2e_body.json || die "health body"

echo "== Wrong bearer =="
c=$(code_body "${BASE_URL}/api/me" -H "Authorization: Bearer wrong-token")
expect_code "$c" 401 "wrong bearer"

echo "== GET /api/me =="
c=$(code_body "${BASE_URL}/api/me" "${AUTH[@]}")
expect_code "$c" 200 "GET /api/me"
grep -q '"userId"' /tmp/e2e_body.json || die "me body"

echo "== GET /api/profile =="
c=$(code_body "${BASE_URL}/api/profile" "${AUTH[@]}")
[[ "$c" == "200" || "$c" == "404" ]] || die "GET profile: expected 200 or 404, got $c"

echo "== PUT /api/profile =="
c=$(code_body "${BASE_URL}/api/profile" -X PUT "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"firstName":"E2E","lastName":"Script","major":"CS","graduationYear":2027}')
expect_code "$c" 200 "PUT profile"

echo "== POST /api/questionnaire =="
c=$(code_body "${BASE_URL}/api/questionnaire" -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"answers":{"schedule":"Sat","plans":"Coffee","topic":"E2E"}}')
expect_code "$c" 200 "POST questionnaire"

echo "== PUT /api/preferences =="
c=$(code_body "${BASE_URL}/api/preferences" -X PUT "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"preferredGenders":["any"],"interests":["e2e-script"]}')
expect_code "$c" 200 "PUT preferences"

echo "== GET /api/weeks/current =="
c=$(code_body "${BASE_URL}/api/weeks/current" "${AUTH[@]}")
expect_code "$c" 200 "GET weeks/current"

echo "== PUT /api/weeks/current/opt-in =="
c=$(code_body "${BASE_URL}/api/weeks/current/opt-in" -X PUT "${AUTH[@]}")
if [[ "$c" == "409" ]]; then
  echo "(opt-in 409 — user may already be MATCHED from SEED_ACTIVE_MATCH; continuing)"
elif [[ "$c" == "200" ]]; then
  :
else
  die "PUT opt-in: expected 200 or 409, got $c — $(cat /tmp/e2e_body.json)"
fi

echo "== POST /api/reports =="
c=$(code_body "${BASE_URL}/api/reports" -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"reportedUserId":"dev-peer-user","reason":"OTHER"}')
if [[ -n "$MID" ]]; then
  expect_code "$c" 201 "POST reports (with E2E_MATCH_ID set)"
else
  expect_code "$c" 403 "POST reports (no match expected without E2E_MATCH_ID)"
fi

echo "== POST /api/blocks =="
c=$(code_body "${BASE_URL}/api/blocks" -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"blockedUserId":"dev-peer-user"}')
if [[ -n "$MID" ]]; then
  expect_code "$c" 201 "POST blocks (with match)"
else
  expect_code "$c" 403 "POST blocks (no match)"
fi

if [[ -n "$MID" ]]; then
  echo "== POST /api/matches/.../response =="
  c=$(code_body "${BASE_URL}/api/matches/${MID}/response" -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
    -d '{"response":"ACCEPTED"}')
  expect_code "$c" 200 "POST match response"
fi

echo "OK — local-api-e2e passed"
