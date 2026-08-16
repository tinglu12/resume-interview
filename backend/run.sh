#!/usr/bin/env bash
# Start the backend cleanly: services -> deps -> migrations -> uvicorn.
#
#   ./run.sh              # full clean start
#   ./run.sh --no-docker  # skip docker compose (e.g. pointing at Neon)
#   ./run.sh --port 8001
set -euo pipefail

cd "$(dirname "$0")"

VENV=.venv
PORT=8000
USE_DOCKER=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-docker) USE_DOCKER=0; shift ;;
    --port) PORT="$2"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

log() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
die() { printf '\033[1;31mERROR:\033[0m %s\n' "$1" >&2; exit 1; }

# 1. Env file
[[ -f .env ]] || die ".env is missing. Run: cp .env.example .env  (then fill it in)"

# 2. Virtualenv + dependencies (reinstall only when requirements.txt changes)
if [[ ! -x "$VENV/bin/python" ]]; then
  log "Creating virtualenv"
  python3 -m venv "$VENV"
fi

REQ_STAMP="$VENV/.requirements.sha"
REQ_HASH=$(sha256sum requirements.txt | cut -d' ' -f1)
if [[ ! -f "$REQ_STAMP" || "$(cat "$REQ_STAMP")" != "$REQ_HASH" ]]; then
  log "Installing dependencies"
  "$VENV/bin/pip" install --quiet --upgrade pip
  "$VENV/bin/pip" install --quiet -r requirements.txt
  echo "$REQ_HASH" > "$REQ_STAMP"
else
  log "Dependencies up to date"
fi

# 3. Local services (Postgres 5433, MinIO 9000/9001)
if [[ "$USE_DOCKER" == 1 ]]; then
  if docker info >/dev/null 2>&1; then
    log "Starting Postgres + MinIO"
    docker compose up -d

    log "Waiting for Postgres"
    for i in {1..30}; do
      if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        break
      fi
      [[ $i == 30 ]] && die "Postgres did not become ready in 30s"
      sleep 1
    done
  else
    die "Docker is not running. Start Docker, or use ./run.sh --no-docker"
  fi
fi

# 4. Free the port if a stale server is holding it
if PIDS=$(lsof -ti "tcp:$PORT" 2>/dev/null) && [[ -n "$PIDS" ]]; then
  log "Killing stale process on port $PORT ($PIDS)"
  kill $PIDS 2>/dev/null || true
  sleep 1
fi

# 5. Migrations
log "Applying migrations"
"$VENV/bin/alembic" upgrade head

# 6. Server
log "Starting API on http://localhost:$PORT  (docs: /docs)"
exec "$VENV/bin/uvicorn" main:app --reload --port "$PORT"
