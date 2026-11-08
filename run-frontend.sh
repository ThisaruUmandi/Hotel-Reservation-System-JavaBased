#!/usr/bin/env bash
# Starts the React site on http://localhost:5173 (it forwards /api to the backend on port 8080)
set -euo pipefail
cd "$(dirname "$0")/frontend"
[ -d node_modules ] || npm install
exec npm run dev
