#!/usr/bin/env bash
# Starts the Spring Boot API on http://localhost:8080 using the settings in backend/.env
set -euo pipefail
cd "$(dirname "$0")/backend"
if [ ! -f .env ]; then
  echo "backend/.env was not found. Run ./scripts/setup-local.sh first (see the README)." >&2
  exit 1
fi
set -a; . ./.env; set +a
exec mvn spring-boot:run
