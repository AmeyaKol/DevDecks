# DevDecks API specification (authoritative)

This document is the **single source of truth** for the **HTTP JSON API** exposed by the Express server. It supersedes ad-hoc excerpts in older files; use this together with the machine-readable OpenAPI file below.

| Resource | Purpose |
|----------|---------|
| **`server/docs/openapi.yaml`** | OpenAPI 3.0.3 — import into Postman, Insomnia, or LLM/agent tools; also drives **Swagger UI** at `/api/docs` when the server is running. |
| **`API_SPEC.md`** (this file) | Conventions, environments, auth, rate limits, and how to consume the spec. |
| **`IR_BUILD_SPEC.md`** | Semantic retrieval, RAG, topic mining, and `Flashcard` field semantics (embedding chunks, `topicNodes`). |

Legacy references (partially outdated): `API_DOCS.md` (production curl examples), `API_DOCUMENTATION.md` (mixed accurate routes with an obsolete flashcard `answer` field — the product uses `explanation`, not `answer`).

---

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Local API | `http://localhost:5001/api` |
| Production (example) | `https://devdecks-api.onrender.com/api` |

All paths in `openapi.yaml` are **relative** to this base (e.g. `POST /users/login` → `POST http://localhost:5001/api/users/login`).

---

## Interactive documentation (Swagger UI)

With the backend running:

- Local: [http://localhost:5001/api/docs](http://localhost:5001/api/docs)
- Production: `https://<your-deployed-host>/api/docs`

The UI loads `server/docs/openapi.yaml` from disk at server startup.

---

## Postman

1. **Import OpenAPI:** Postman → **Import** → **File** → select `server/docs/openapi.yaml`.
2. **Set variables:** Create an environment with:
   - `baseUrl` = `http://localhost:5001/api` (or production URL).
   - `token` = JWT from `POST /users/login` or `POST /users/register`.
3. **Authorize:** For protected routes, set collection or request **Authorization** → **Bearer Token** → `{{token}}`.

The OpenAPI file marks operations that use optional auth (`security: []`); Postman may still send a token if you configure the collection — that is fine for those routes.

---

## Agents and codegen

- **Feed the spec:** Point tools at the **file path** `server/docs/openapi.yaml` or paste its contents. OpenAPI 3 is widely supported for client stubs and test generation.
- **Ground truth:** If the spec disagrees with behavior, **the route handlers in `server/routes/` and `server/controllers/` win** — open an issue or update `openapi.yaml` in the same PR as code changes.

---

## Authentication

- **Issue tokens:** `POST /users/register` or `POST /users/login` return a `token` string (JWT).
- **Send tokens:** Header `Authorization: Bearer <token>`.
- **Protected areas:** All routes under `/ai/*` require authentication. Most `POST`, `PUT`, and `DELETE` operations on user-owned resources require authentication.

---

## Rate limiting (production)

From `server/server.js` (limits are **skipped** when `NODE_ENV` is not `production`, e.g. local dev):

| Scope | Limit |
|-------|--------|
| General (`/api/*`) | 100 requests / 15 minutes / IP |
| `POST /users/login`, `POST /users/register` | 10 / hour / IP |
| `GET` on `/api/flashcards`, `/api/decks` | 60 / minute / IP |
| YouTube routes | Additional hourly caps on playlist import |

Typical response when limited: **429** with an `error` message JSON body.

---

## Response shape notes

### Pagination

`GET /decks` and `GET /flashcards` default to paginated JSON with `pagination` (and for flashcards, `filters.availableTags`). If `paginate=false`, the API may return a **raw array** for backward compatibility (documented in OpenAPI as `oneOf`).

### Flashcard model

Create/update expects **`question`**, **`explanation`**, and **`type`** — not a separate `answer` field. Optional fields include `problemStatement`, `code`, `decks` (array of ids), `tags`, etc. New cards trigger **semantic artifact** generation (`embeddingVersion`, `semanticChunks`, `topicNodes`) on the server.

### User `recents`

The profile and login responses expose **`recents`**: an array of `{ deckId, lastAccessed }`, not a flat list of deck ids.

### YouTube

`POST /youtube/playlist` returns **`playlistId`**, **`videos`**, and debug metadata; it does not require a `deckId` in the body (older informal docs may differ).

---

## Admin

- `GET /metrics` — JWT + admin flag (`isAdmin` on user). Not intended for public clients.

---

## Changelog (spec)

| Version | Notes |
|---------|--------|
| 1.1.0 | Full route set aligned with `server/routes/*`; AI IR endpoints (`semantic-search`, `rag-tutor`, `topic-mine`, `reindex-semantic`); folders `deck` sub-resource; deck markdown export; flashcard `created-on-date`. |

---

## Maintenance

When you add or change an HTTP route:

1. Update **`server/docs/openapi.yaml`** in the same change.
2. Keep this file focused on conventions and keep concrete request examples in the OpenAPI examples section.
