# Backend — Resume Interview API

FastAPI + PostgreSQL (Neon) + Cloudflare R2 + OpenAI

## First-time setup

### 1. Create the virtual environment and install dependencies

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `backend/.env`:

| Variable               | Where to find it                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Neon dashboard → your project → Connection string. Change `postgresql://` to `postgresql+asyncpg://` |
| `CLERK_JWKS_URL`       | Clerk dashboard → your app → API Keys → JWKS URL                                                     |
| `OPENAI_API_KEY`       | platform.openai.com → API Keys                                                                       |
| `R2_ACCOUNT_ID`        | Cloudflare dashboard → R2 → Account ID (top right)                                                   |
| `R2_ACCESS_KEY_ID`     | Cloudflare R2 → Manage R2 API tokens → Create token                                                  |
| `R2_SECRET_ACCESS_KEY` | Same as above                                                                                        |
| `R2_BUCKET_NAME`       | Name of your R2 bucket                                                                               |
| `R2_PUBLIC_URL`        | R2 bucket → Settings → Public access URL                                                             |

### 3. Run database migrations

Only needed the first time, or when models change.

```bash
# Generate a migration file from your models
.venv/bin/alembic revision --autogenerate -m "description"

# Apply migrations to the database
.venv/bin/alembic upgrade head
```

> **Note:** Alembic uses a sync database connection internally. It reads `DATABASE_URL` from your `.env` and automatically converts it to use psycopg2.

---

## Running the server

```bash
.venv/bin/uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

- Interactive docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

## Project structure

```
backend/
├── main.py              # FastAPI app + CORS + router registration
├── auth.py              # Clerk JWT verification middleware
├── config.py            # Pydantic settings (reads from .env)
├── database.py          # SQLAlchemy async engine + session
├── models.py            # ORM models: Job, Session, Answer
├── schemas.py           # Pydantic request/response schemas
├── routers/
│   ├── jobs.py          # POST /jobs, GET /jobs, GET /jobs/{id}
│   ├── sessions.py      # POST/GET /jobs/{id}/sessions, GET /sessions/{id}
│   └── answers.py       # POST /sessions/{id}/answers
├── services/
│   ├── ai.py            # GPT-4o: question generation, answer feedback, OCR
│   ├── pdf.py           # PDF text extraction (pdfplumber + PyMuPDF fallback)
│   ├── storage.py       # Cloudflare R2 upload/download
│   └── transcription.py # OpenAI Whisper audio transcription
└── alembic/             # Database migrations
```

---

## Common commands

```bash
# Run server (hot reload)
.venv/bin/uvicorn main:app --reload

# Apply latest migrations
.venv/bin/alembic upgrade head

# Generate a new migration after changing models.py
.venv/bin/alembic revision --autogenerate -m "your description"

# Check current migration state
.venv/bin/alembic current
```

## Docker

docker compose up

### Resetting the local dev environment

The Postgres/MinIO containers use **persistent** volumes — they don't reset when you
switch git branches. If you switch to a branch with a different migration history
(e.g. one that adds/drops columns another branch already applied), Alembic will fail
with `Can't locate revision identified by '...'`, or the app will error at runtime
because the schema doesn't match the current branch's models.

When that happens, reset everything (**this destroys all local dev data — Postgres
rows and uploaded files in MinIO — so back up anything you want to keep first, e.g.
`docker exec backend-postgres-1 pg_dump -U postgres resume_interview > backup.sql`**):

```bash
docker compose down -v && docker compose up -d && .venv/bin/alembic upgrade head
```

---

## Testing

Tests run against a dedicated Postgres database (`resume_interview_test`) on
the same local Docker container used for dev — never against the dev or
prod database. Each test runs inside a transaction that's rolled back at
teardown, so tests can't leak data into each other.

### One-time setup

```bash
.venv/bin/pip install -r requirements-dev.txt

# Create the test database (only needed once; uses the same Postgres
# container as local dev, see docker-compose.yml)
docker exec backend-postgres-1 psql -U postgres -c "CREATE DATABASE resume_interview_test;"
```

### Running tests

```bash
.venv/bin/pytest                              # run the suite
.venv/bin/pytest -v                           # verbose
.venv/bin/pytest --cov --cov-report=term-missing  # with coverage
```

Auth is stubbed in tests: `tests/conftest.py` overrides the
`verify_clerk_token` FastAPI dependency with a fixed test user id, so tests
don't need real Clerk JWTs. `tests/conftest.py` also overrides `get_db` to
hand out the per-test transactional session.

