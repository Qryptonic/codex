#!/usr/bin/env bash
set -euo pipefail

# --- prereqs ------------------------------------------------------------
command -v docker &>/dev/null || { echo "❌  Docker is required"; exit 1; }
command -v npm    &>/dev/null || { echo "❌  Node/NPM are required"; exit 1; }
[[ $(node -v) =~ ^v(18|20|23) ]] || { echo "❌  Node 18, 20, or 23 required"; exit 1; }

# help / stop flags
[[ ${1:-} == -h* ]] && { echo "Usage: PORT=4000 ./run.sh  |  ./run.sh --stop"; exit 0; }
[[ ${1:-} == --stop ]] && { docker compose -f docker-compose.dev.yml down; exit 0; }

# auto-cleanup on Ctrl-C
cleanup() { echo; echo -e "\033[33m🧹  Cleaning up...\033[0m"; docker compose -f docker-compose.dev.yml down; }
trap cleanup INT TERM

# 🐳 1. spin up backend stack (detached, wait for health)
echo -e "\033[36m🐳  Starting backend services...\033[0m"
docker compose -f docker-compose.dev.yml up -d --build --wait gateway redpanda redis
echo -e "\033[32m✅  Backend ready\033[0m"

# 🎨 2. start the UI (port 3000) *outside* the containers for fast HMR
echo -e "\033[36m🎨  Starting UI on port ${PORT:-3000}...\033[0m"
pushd ui >/dev/null
  export PORT=${PORT:-3000}          # allow override:  PORT=4000 ./run.sh
  npm ci --silent
  echo -e "\033[32m✅  Dependencies installed\033[0m"
  npx vite --host --port "$PORT"
popd >/dev/null

cleanup        # executes if vite exits