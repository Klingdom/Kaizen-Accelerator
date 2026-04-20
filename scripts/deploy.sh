#!/usr/bin/env bash
# BAM-X Kaizen OS — one-shot deploy script.
#
# Usage on the VPS:
#   cd /opt/bamx
#   ./scripts/deploy.sh
#
# Also runnable from the GitHub Actions deploy workflow (see .github/workflows/deploy.yml).
# This script is idempotent: safe to re-run at any time.

set -euo pipefail

# Resolve repo root (one level up from scripts/).
REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> BAM-X deploy — $(date --iso-8601=seconds)"
echo "    repo: $REPO_ROOT"
echo "    sha:  $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# Require .env to exist on the VPS.
if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in $REPO_ROOT" >&2
  echo "       cp .env.example .env and fill in DOMAIN + ACME_EMAIL before first deploy." >&2
  exit 1
fi

# Source .env so DOMAIN is visible to docker compose substitutions below.
set -a
# shellcheck disable=SC1091
source .env
set +a

echo "==> Fetch latest main"
git fetch --quiet origin main
git reset --hard origin/main

echo "==> docker compose up"
docker compose pull --ignore-buildable
docker compose up -d --build --remove-orphans

echo "==> Prune"
docker container prune -f >/dev/null
docker image prune -f >/dev/null

echo "==> Wait for web to report healthy"
for i in {1..30}; do
  if curl -fsS "http://localhost/health" >/dev/null 2>&1; then
    echo "✔ deploy healthy (DOMAIN=${DOMAIN:-localhost})"
    exit 0
  fi
  sleep 2
done

echo "✗ health check failed after 60s" >&2
docker compose logs --tail=100 web >&2
exit 1
