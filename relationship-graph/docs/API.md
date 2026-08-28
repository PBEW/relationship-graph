# API Documentation

Base URL: `/api` (e.g. `http://localhost:5000/api` in local dev, proxied through `/api` in the frontend/nginx).

All responses are JSON. Errors follow `{"error": "message"}`, validation errors `{"error": "Validation failed", "details": {...}}`.

> **Auth:** every endpoint below except `/api/auth/login` requires `Authorization: Bearer <access_token>` — including `GET`s. A token is rejected (401) if its account has since been deactivated, even if the token itself hasn't expired. `/api/users/*` additionally requires the `super_admin` role (403 otherwise).

## Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check. Returns `{"status": "ok"}`. |

## Auth

Multi-user app backed by a `users` table (see `database/README.md`). The first account (role `super_admin`) is seeded by migration `5490fe2cba1e` from `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD` (or `SUPER_ADMIN_PASSWORD_HASH`) env vars — see `backend/.env.example`. Dev default: `admin` / `admin`. Every other account is managed afterward via `/api/users` (or the admin panel's "ผู้ใช้งาน" tab), not env vars.

Two roles: `member` (full read/write access to people/relationships/types — same as the old single-admin) and `super_admin` (everything a member can do, plus managing accounts). The whole site requires login — there is no public/anonymous read access.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Body: `username`, `password`. Returns `{ access_token, refresh_token }`. Rejects (401) unknown username, wrong password, or a deactivated account. **Rate limited** to 10/minute and 60/hour per client IP; over that it returns 429 without touching the database. Access token expires in `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` (15 by default, 5 in the Render deploy), refresh in 30 days. |
| POST | `/api/auth/refresh` | refresh token | Returns a new `access_token`. Also 401s if the account was deactivated since the refresh token was issued. |
| POST | `/api/auth/logout` | access token | Revokes the presented access token (tracked in an in-memory blocklist — see caveat below). |
| GET | `/api/auth/me` | access token | Returns `{ "id", "username", "role" }` for the current token. |

> **Caveat:** the logout blocklist is an in-memory Python `set` and the login rate limiter counts in process memory, so both are only correct in a single process. `render.yaml` therefore runs gunicorn with `--workers 1` and shortens access tokens to 5 minutes (the worst case a revoked token can outlive its logout). The Docker Compose setup still runs 4 workers and is affected. Move both to a shared store (e.g. Redis) before scaling out.

> **Behind a proxy:** the app applies `ProxyFix(x_for=1)`, so rate limiting keys on the real client IP rather than the load balancer's. Deploying it somewhere *without* a proxy in front means clients could spoof `X-Forwarded-For`; drop that middleware in `app/__init__.py` if so.

## Activity log (super admin only)

| Method | Path | Description |
|---|---|---|
| GET | `/api/activity` | Paginated history, newest first. Query: `page`, `per_page`, `action` (`login`\|`logout`\|`create`\|`update`\|`delete`), `user_id`. |

Each entry carries `username`, `action`, `entity_type`, `entity_id`, a human-readable `summary` of what was acted on, `created_at`, and `user_exists`.

Sign-ins and data changes share one table so the admin panel can show a single chronological history. Entries are written only after the action succeeds, and are never updated or deleted by the app — an audit trail its own users could edit wouldn't be worth keeping. `username` and `summary` are snapshots taken at the time, so an entry still reads correctly after the account or the record it names is gone (`user_exists` goes false, `user_id` null).

> The log grows without bound. Rows are small (a few hundred bytes), so a community this size won't trouble the free tier for years, but it has no retention policy — add one before that stops being true.

## Users (super admin only)

| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | List all accounts, each with `last_login_at` (null until their first sign-in). |
| POST | `/api/users` | Create an account. Body: `username` (unique, 3-80 chars), `password` (min 4 chars), `role` (`member`\|`super_admin`, default `member`). |
| PATCH | `/api/users/<uuid>` | Partial update — `username`, `password` (optional; only rehashed if provided), `role`, `is_active`. Deactivating a user (`is_active: false`) blocks their next request immediately, even on an unexpired token. |
| DELETE | `/api/users/<uuid>` | Delete an account. |

Safety rules (409 on violation): you can't delete your own account, and you can't demote/deactivate/delete the last active `super_admin` — both would risk locking everyone out of user management.

## People

| Method | Path | Description |
|---|---|---|
| GET | `/api/people` | List people. Query: `page`, `per_page` (max 100), `search` (matches display name, nickname, VRChat name, Discord, Steam, Twitter), `gender`, `country`. |
| GET | `/api/people/<uuid>` | Get a person's full profile: person, all relationships, computed timeline, and stats. |
| POST | `/api/people` | Create a person. Body: `display_name` (required) + optional `nickname`, `vrchat_name`, `discord`, `steam`, `twitter`, `country`, `gender`, `birthday`, `bio`, `avatar`. |
| PUT | `/api/people/<uuid>` | Partial update — any subset of the create fields. |
| DELETE | `/api/people/<uuid>` | **Super admin only** (403 otherwise) — cascades to every relationship the person appears in, and discards their stored avatar. |
| POST | `/api/people/<uuid>/avatar` | Upload an avatar. `multipart/form-data` with field `avatar` (png/jpg/jpeg/gif/webp, max 5MB). Stored in the database, downscaled to 512×512; replaces and deletes the previous one. Returns the updated person, whose `avatar` is the URL below. |

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

Two people can hold only one **active** relationship of a given type — creating or editing into a second one returns **409**, in either direction. Ended ones are exempt on purpose: dating, breaking up and getting back together is history worth keeping as separate rows.

## Relationship Types

| Method | Path | Description |
|---|---|---|
| GET | `/api/relationship-types` | List all types, alphabetical. |
| GET | `/api/relationship-types/<uuid>` | Get one type. |
| POST | `/api/relationship-types` | Create. Body: `name` (unique), `color` (`#RRGGBB`), `icon` (lucide-react icon name), `description`. |
| PUT | `/api/relationship-types/<uuid>` | Partial update. |
| DELETE | `/api/relationship-types/<uuid>` | **Super admin only** (403 otherwise) — types are shared vocabulary. **409** if any relationship still uses this type. |

## Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | `total_people`, `total_relationships`, `relationship_distribution` (count per type), `most_connected` (top 10), `recently_added` (last 10). |

## Graph

| Method | Path | Description |
|---|---|---|
| GET | `/api/graph` | All people/relationships in a flat `{ nodes, edges }` shape, ready for React Flow. |

`nodes[]`: `id`, `display_name`, `nickname`, `avatar`.
`edges[]`: `id`, `source`, `target`, `status`, `start_date`, `end_date`, `note`, `relationship_type` (full object, including `description`) — enough to render the relationship-detail popup without a second request.

## Avatars

| Method | Path | Description |
|---|---|---|
| GET | `/api/avatars/<uuid>` | Serves a stored avatar image. `Cache-Control: public, max-age=31536000, immutable` — safe because a new upload mints a new id rather than overwriting. |

Uploads are validated as real images (Pillow-decoded, not just extension-checked) and downscaled to a max of 512×512 (aspect ratio preserved, never upscaled) before storage.

Images live in the database rather than on disk, because the free hosting tier wipes the filesystem on every deploy. At 512×512 a whole community's avatars is a few megabytes.

> **This route is deliberately unauthenticated**, unlike the rest of the API: a browser can't attach an `Authorization` header to a plain `<img src>`. Ids are random UUIDs that only ever appear in authenticated responses, so an image is reachable only by someone already handed its URL — the same posture as the `/uploads/` route it replaced. Don't put anything here that would be sensitive if the link leaked.

---

Implemented and smoke-tested against SQLite (no local/Docker Postgres available in the dev environment) — full CRUD, search, pagination, validation errors, cascade delete, the in-use guard on relationship types, the full auth flow (login, bad password, disabled account, missing/expired/revoked/wrong-type tokens, refresh, logout), user management (create/list/update/delete, role and last-super-admin safety checks), and the profile/timeline/dashboard/graph aggregations all verified working end-to-end (48 pytest cases). Not yet verified against real PostgreSQL (see `database/README.md`).
