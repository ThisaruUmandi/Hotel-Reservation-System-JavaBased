#!/usr/bin/env bash
# Starts the backend and the frontend together. Press Ctrl+C once to stop both.
set -euo pipefail
cd "$(dirname "$0")"
trap 'kill 0' INT TERM EXIT
./run-backend.sh &
./run-frontend.sh &
wait
