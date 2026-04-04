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
