# Online Relationship Graph

An interactive web app for mapping people and relationships in online communities (VRChat, Discord, gaming guilds, etc.) — search people, explore an interactive relationship graph, view profiles with timelines, and manage everything through an admin panel.

> **Status:** Phase 1 (Project Initialization) complete. See [Roadmap](#roadmap) below.

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

Admin login (dev default — **change before deploying**, see `backend/.env.example`): username `admin`, password `admin`.

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
- [ ] **Phase 10** — Testing

## API Documentation

See [docs/API.md](docs/API.md) (populated from Phase 3 onward).
