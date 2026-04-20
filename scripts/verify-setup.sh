#!/usr/bin/env bash
# BAM-X Kaizen OS — post-deploy verification script.
#
# Runs on the VPS (or locally) and checks the running stack:
#   1. docker compose reports all services healthy
#   2. /health endpoint returns 200
#   3. Root / serves index.html
#   4. /js/domain/types.js serves with the correct MIME
#   5. Design docs and tests are not publicly exposed
#
# Exit 0 on success, non-zero with a descriptive message on failure.

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BASE_URL="${BASE_URL:-http://localhost}"
fails=0

log_ok()   { echo "✔ $1"; }
log_fail() { echo "✗ $1" >&2; fails=$((fails + 1)); }

# ─── 1. docker compose service health ──────────────────────────────────────
echo "==> docker compose status"
if ! docker compose ps --format json >/dev/null 2>&1; then
  log_fail "docker compose not running or not installed"
else
  unhealthy="$(docker compose ps --format '{{.Name}} {{.Health}}' | awk '$2 != "healthy" && $2 != "" {print}')"
  if [[ -z "$unhealthy" ]]; then
    log_ok "all compose services healthy"
  else
    log_fail "unhealthy services:\n$unhealthy"
  fi
fi

# ─── 2. /health endpoint ────────────────────────────────────────────────────
echo "==> GET $BASE_URL/health"
status="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/health" || echo '000')"
body="$(curl -fsS "$BASE_URL/health" 2>/dev/null || echo '')"
if [[ "$status" == "200" && "$body" == "ok" ]]; then
  log_ok "/health returned 200 ok"
else
  log_fail "/health returned status=$status body='$body'"
fi

# ─── 3. Root serves index.html ──────────────────────────────────────────────
echo "==> GET $BASE_URL/"
if curl -fsS "$BASE_URL/" | grep -qi '<html'; then
  log_ok "root serves HTML"
else
  log_fail "root did not return HTML"
fi

# ─── 4. JS modules served with correct MIME ────────────────────────────────
echo "==> GET $BASE_URL/js/domain/types.js"
js_mime="$(curl -s -o /dev/null -w '%{content_type}' "$BASE_URL/js/domain/types.js" || echo '')"
if [[ "$js_mime" == application/javascript* ]]; then
  log_ok "js served as $js_mime"
else
  log_fail "js MIME wrong: '$js_mime' (expected application/javascript*)"
fi

# ─── 5. Design docs and test files are NOT exposed ─────────────────────────
echo "==> confirm design docs are not publicly served"
for secret_path in /ARCHITECTURE.md /Dockerfile /.env /tests/boot.test.js /docs/development-plan; do
  status="$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL$secret_path" || echo '000')"
  if [[ "$status" == "404" || "$status" == "403" ]]; then
    log_ok "$secret_path blocked ($status)"
  else
    log_fail "$secret_path returned $status (expected 404/403)"
  fi
done

echo
if [[ $fails -eq 0 ]]; then
  echo "✔ all checks passed"
  exit 0
else
  echo "✗ $fails check(s) failed" >&2
  exit 1
fi
