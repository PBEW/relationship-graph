# API Documentation

Base URL: `/api` (e.g. `http://localhost:5000/api` in local dev, proxied through `/api` in the frontend/nginx).

All responses are JSON. Errors follow `{"error": "message"}`, validation errors `{"error": "Validation failed", "details": {...}}`.

> **Auth note:** Authentication (JWT) is implemented in Phase 4. Until then, all endpoints below are open. Once Phase 4 lands, `POST`/`PUT`/`DELETE` endpoints will require a valid access token (`Authorization: Bearer <token>`).

## Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check. Returns `{"status": "ok"}`. |

## People

| Method | Path | Description |
|---|---|---|
| GET | `/api/people` | List people. Query: `page`, `per_page` (max 100), `search` (matches display name, nickname, VRChat name, Discord, Steam, Twitter), `gender`, `country`. |
| GET | `/api/people/<uuid>` | Get a person's full profile: person, all relationships, computed timeline, and stats. |
| POST | `/api/people` | Create a person. Body: `display_name` (required) + optional `nickname`, `vrchat_name`, `discord`, `steam`, `twitter`, `country`, `gender`, `birthday`, `bio`, `avatar`. |
| PUT | `/api/people/<uuid>` | Partial update — any subset of the create fields. |
| DELETE | `/api/people/<uuid>` | Delete a person (cascades their relationships, removes their avatar file). |
| POST | `/api/people/<uuid>/avatar` | Upload an avatar. `multipart/form-data` with field `avatar` (png/jpg/jpeg/gif/webp, max 5MB). Replaces and deletes the previous file. |

`gender` is one of `male | female | non_binary | other | unspecified`.

### Example: person profile response

```json
{
  "person": { "id": "...", "display_name": "Alice", "...": "..." },
  "relationships": [ { "id": "...", "person_a": {...}, "person_b": {...}, "relationship_type": {...}, "...": "..." } ],
  "timeline": [
    { "date": "2024-01-01", "event": "started", "relationship_type": "Friend", "with_person_name": "Bob", "...": "..." },
    { "date": "2024-06-01", "event": "ended", "relationship_type": "Friend", "with_person_name": "Bob", "...": "..." }
  ],
  "stats": { "total_relationships": 1, "active_relationships": 0, "ended_relationships": 1, "by_type": { "Friend": 1 } }
}
```

## Relationships

| Method | Path | Description |
|---|---|---|
| GET | `/api/relationships` | List relationships. Query: `page`, `per_page`, `person_id`, `relationship_type_id`, `status`. |
| GET | `/api/relationships/<uuid>` | Get one relationship (with nested person/type). |
| POST | `/api/relationships` | Create. Body: `person_a_id`, `person_b_id`, `relationship_type_id` (required), `status` (`active`\|`ended`, default `active`), `start_date`, `end_date`, `note`. |
| PUT | `/api/relationships/<uuid>` | Partial update. |
| DELETE | `/api/relationships/<uuid>` | Delete. |

Validation: `person_a_id` must differ from `person_b_id`; `end_date` (if set) must be `>= start_date`; all referenced IDs must exist (422 otherwise).

## Relationship Types

| Method | Path | Description |
|---|---|---|
| GET | `/api/relationship-types` | List all types, alphabetical. |
| GET | `/api/relationship-types/<uuid>` | Get one type. |
| POST | `/api/relationship-types` | Create. Body: `name` (unique), `color` (`#RRGGBB`), `icon` (lucide-react icon name), `description`. |
| PUT | `/api/relationship-types/<uuid>` | Partial update. |
| DELETE | `/api/relationship-types/<uuid>` | Delete — **409** if any relationship still uses this type. |

## Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | `total_people`, `total_relationships`, `relationship_distribution` (count per type), `most_connected` (top 10), `recently_added` (last 10). |

## Graph

| Method | Path | Description |
|---|---|---|
| GET | `/api/graph` | All people/relationships in a flat `{ nodes, edges }` shape, ready for React Flow. |

## Uploads

| Method | Path | Description |
|---|---|---|
| GET | `/uploads/<filename>` | Serves a stored avatar file (not under `/api`). |

---

Implemented and smoke-tested against SQLite (no local/Docker Postgres available in the dev environment) — full CRUD, search, pagination, validation errors, cascade delete, the in-use guard on relationship types, and the profile/timeline/dashboard/graph aggregations all verified working end-to-end. Not yet verified against real PostgreSQL (see `database/README.md`).
