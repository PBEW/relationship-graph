# 3 ชั่วโมงไร้ค่า (Online Relationship Graph)

An interactive web app for mapping people and relationships in online communities (VRChat, Discord, gaming guilds, etc.) — search people, explore an interactive relationship graph, view profiles with timelines, add relationships directly from a person's profile, and manage everything through an admin panel. The UI is localized in Thai.

> **Status:** All 10 phases complete. See [Roadmap](#roadmap) and [Known Limitations](#known-limitations) below.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Flow (`@xyflow/react`), TanStack Query, React Router, Axios, React Hook Form, Zod |
| Backend | Python 3.13, Flask, SQLAlchemy, Alembic (Flask-Migrate), Flask-JWT-Extended, Flask-CORS, Marshmallow |
| Database | PostgreSQL |
| Auth | JWT (access + refresh) |
| Deployment | Docker, Docker Compose |

## Folder Structure

```
relationship-graph/
├── frontend/         React + TypeScript SPA (Vite)
├── backend/          Flask API (clean architecture: models/repositories/services/schemas/api)
├── database/         SQL notes / ER diagrams (migrations live in backend/migrations)
├── docker/           Shared Docker assets (if any beyond per-service Dockerfiles)
├── docs/             API docs, architecture notes
├── scripts/          Seed scripts, maintenance scripts
├── docker-compose.yml
└── .env.example
```

## Getting Started

### Option A — Docker Compose (recommended once available)

Requires Docker Desktop with Compose v2.

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- pgAdmin: http://localhost:5050

> Migrations run automatically (`flask db upgrade`) before the backend starts.

To seed fake data, run the seed script from your host machine against the containerized Postgres (exposed on `localhost:5432`) — it isn't bundled into the backend image. From `backend/`, with a venv that has `requirements.txt` installed and `DATABASE_URL` pointing at `localhost:5432`: `python ../scripts/seed.py`.

First login (dev default super admin — **change before deploying**, see `backend/.env.example`): username `admin`, password `admin`. The whole site requires login; the super admin can create/disable more accounts for friends from the admin panel's "ผู้ใช้งาน" tab.

### Option B — Local development (no Docker)

**Backend**

```bash
cd backend
python -m venv venv
./venv/Scripts/activate        # Windows
pip install -r requirements.txt
cp .env.example .env            # then point DATABASE_URL at your local Postgres
flask run --port 5000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Requires a local PostgreSQL instance matching `DATABASE_URL` in `backend/.env`.

### Seeding fake data

```bash
cd backend
python ../scripts/seed.py     # 100 people, 300 relationships, generated avatars
```

See [scripts/README.md](scripts/README.md) for options (`--people`, `--relationships`, `--reset`, `--no-avatars`).

## Backend Architecture

Clean architecture with a strict dependency direction:

```
api (controllers/blueprints) → services (business logic) → repositories (data access) → models (SQLAlchemy)
                                     ↓
                                schemas (Marshmallow validation/serialization)
```

- **models/** — SQLAlchemy ORM models, one file per entity.
- **repositories/** — Query logic only; no business rules.
- **services/** — Business logic, orchestrates repositories, raises domain errors.
- **schemas/** — Marshmallow request validation and response serialization.
- **api/** — Flask blueprints; thin controllers that call services.

## Testing

**Backend** (pytest, 48 tests — auth, users, people, relationships, relationship types, dashboard, graph):

```bash
cd backend
pip install -r requirements-dev.txt
cp .env.example .env    # TEST_DATABASE_URL must point at a real Postgres database
pytest
```

**Frontend** (Vitest + React Testing Library — utilities, hooks, and presentational components):

```bash
cd frontend
npm test              # run once
npm run test:watch    # watch mode
```

## Roadmap

- [x] **Phase 1** — Project initialization
- [x] **Phase 2** — Database (models, indexes, constraints, migrations) — see [database/README.md](database/README.md)
- [x] **Phase 3** — Backend (repositories, services, schemas, API) — see [docs/API.md](docs/API.md)
- [x] **Phase 4** — Authentication (JWT)
- [x] **Phase 5** — Frontend layout (sidebar, search, dark mode)
- [x] **Phase 6** — Interactive graph (React Flow)
- [x] **Phase 7** — CRUD (profile page, admin panel)
- [x] **Phase 8** — Dashboard + seed data — see [scripts/README.md](scripts/README.md)
- [x] **Phase 9** — Optimization
- [x] **Phase 10** — Testing

## API Documentation

See [docs/API.md](docs/API.md).

## Known Limitations

This project was built and verified in a dev environment without a local PostgreSQL or Docker installation available, so a few things are worth knowing before you rely on it:

- **Backend correctness was verified against SQLite, not Postgres**, using a scratch compatibility shim (patching the Postgres-only `UUID` type and neutralizing the `~` regex `CHECK` constraint) that exists only in throwaway verification scripts — never committed. All migrations, models, and the pytest suite are written for Postgres and were reviewed carefully, but **run `flask db upgrade` and `pytest` against a real Postgres instance before depending on this in production.**
- **JWT logout uses an in-memory revoked-token set** (`backend/app/services/auth_service.py`). This works correctly for a single process, but the production Dockerfile runs gunicorn with 4 workers — a token revoked on one worker stays valid on the other three. Fine for local dev or a single-worker deployment; swap in a shared store (e.g. Redis) before running multi-worker in production.
- **Frontend E2E behavior was verified manually** (via a browser-automation tool driving the real running app against seeded data) rather than with a committed E2E test suite (e.g. Playwright/Cypress). The Vitest suite covers utilities/hooks/presentational components only — page-level and integration tests are a reasonable next addition.
