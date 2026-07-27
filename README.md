# Task API

A CRUD API for managing a to-do list, built with Node.js and Express — originally in-memory (W2 · A1),
now backed by a real **SQLite** database (W3 · A1) so data survives server restarts.

## What this is

A REST API with five main endpoints (list, get one, create, update, delete) plus a couple of extras
(search/filter/sort, stats, reset). Tasks are stored in a SQLite database file (`tasks.db`) — created
automatically the first time the app runs. Interactive API docs are served via Swagger UI.

## Why SQLite

SQLite needs no separate database server, no install, and no configuration — the whole database is a
single file (`tasks.db`) sitting next to the code. That makes it perfect for a learning project: you
get real, persistent SQL storage with zero setup overhead, and the same SQL skills transfer directly to
Postgres/MySQL later.

I used Node's built-in **`node:sqlite`** module (stable/experimental in Node ≥ 22.5) instead of the
`better-sqlite3` package. Same idea — synchronous, `.prepare(sql).run()/.get()/.all()` API — but it
ships with Node itself, so there's nothing to compile and no native build tools needed on any OS
(this sidesteps a common Windows pain point where `better-sqlite3` needs Visual Studio Build Tools).
If you're on an older Node version, swap `db.js` to use `better-sqlite3` instead — the rest of the code
doesn't need to change.

## Where the database lives

`tasks.db`, in the project root, next to `server.js`. It's git-ignored (like `node_modules`) because
it's generated data, not code — deleting it and restarting the server recreates it automatically with
the 3 seed tasks.

## How to install & run

```bash
npm install && node server.js
```

Requires **Node.js 22.5+** (for `node:sqlite`). The server starts on **http://localhost:3000**, and
`tasks.db` is created automatically on first run (only seeding the 3 example tasks if the table is
empty — restarting again does not duplicate them).

Interactive docs: **http://localhost:3000/docs**

## Endpoints

| Method | Path             | Description                                             | Success | Errors        |
|--------|------------------|-----------------------------------------------------------|---------|---------------|
| GET    | `/`              | API info (name, version, endpoints)                       | 200     | —             |
| GET    | `/health`        | Health check                                               | 200     | —             |
| GET    | `/tasks`         | List all tasks (`?done=`, `?search=`, `?sort=title`)       | 200     | —             |
| GET    | `/tasks/:id`     | Get one task                                               | 200     | 404           |
| POST   | `/tasks`         | Create a task (`{ "title": "..." }`)                       | 201     | 400           |
| PUT    | `/tasks/:id`     | Update a task's `title` and/or `done`                      | 200     | 400, 404      |
| DELETE | `/tasks/:id`     | Delete a task                                              | 204     | 404           |
| GET    | `/stats`         | `{ total, done, open }` counts (via SQL `COUNT()`)         | 200     | —             |
| POST   | `/reset`         | Restore the 3 seed tasks                                   | 200     | —             |

## Example: full CRUD cycle via curl

```bash
$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy milk"}'
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":false,"created_at":"2026-07-27 12:22:09","updated_at":"2026-07-27 12:22:09"}

$ curl -i -X PUT http://localhost:3000/tasks/4 -H "Content-Type: application/json" -d '{"done":true}'
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":true,"created_at":"2026-07-27 12:22:09","updated_at":"2026-07-27 12:22:44"}

$ curl -i -X DELETE http://localhost:3000/tasks/4
HTTP/1.1 204 No Content

$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{}'
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{"error":"title is required and must be a non-empty string"}
```

## Swagger UI

Visit `http://localhost:3000/docs` after starting the server. Every endpoint above is listed with a
"Try it out" button that sends real requests — no curl needed.

> 📸 Add your own screenshot here once you've opened `/docs` in your browser, e.g.:
> `![Swagger UI screenshot](./swagger-screenshot.png)`

## Exploring the database directly (Stage 4)

Opened `tasks.db` with [DB Browser for SQLite](https://sqlitebrowser.org/) and ran these queries by hand:

```sql
SELECT * FROM tasks;
-- id | title          | done | created_at          | updated_at
-- 1  | Buy milk       | 0    | 2026-07-27 12:21:59 | 2026-07-27 12:21:59
-- 2  | Write README   | 0    | 2026-07-27 12:21:59 | 2026-07-27 12:21:59
-- 3  | Walk the dog   | 1    | 2026-07-27 12:21:59 | 2026-07-27 12:21:59

SELECT * FROM tasks WHERE done = 1;
-- returns just "Walk the dog"

SELECT COUNT(*) FROM tasks;
-- 3

UPDATE tasks SET done = 1;
-- marks every task done

DELETE FROM tasks WHERE done = 1;
-- (in this case) deletes everything, since the previous UPDATE marked all tasks done
```


> `![Database viewer screenshot](images/db-viewer-screen.png)`
> `![Database viewer screenshot](images/db-viewer2%20.png)`


I confirmed the API and the database are the same data, not two copies: while the server was running, I
inserted a row directly with a separate script (bypassing the API entirely), and it appeared immediately
in `GET /tasks` with no restart needed.

## The mortality experiment (from W2 · A1) — now fixed

Previously, restarting the server wiped every task, because they lived only in a JS array in memory.
Now: I created a task, restarted the server, and called `GET /tasks` again — the task was still there.
That's the entire point of this assignment: the API's behavior didn't change at all, but data now
survives the process restarting, because it's stored in `tasks.db` on disk instead of RAM.

## Extras implemented

- `GET /tasks?done=true` — filter by completion status (SQL `WHERE`)
- `GET /tasks?search=milk` — case-insensitive title search (SQL `LIKE`)
- `GET /tasks?sort=title` — alphabetical ordering (SQL `ORDER BY`)
- `GET /stats` — `{ total, done, open }` via SQL `COUNT()`
- `POST /reset` — restore the 3 seed tasks
- `created_at` / `updated_at` timestamps on every task

## Project structure

```
task-api/
├── server.js         # the whole API — Express routes, now backed by SQL queries
├── db.js             # opens/creates tasks.db, creates the tasks table, seeds 3 tasks on first run
├── tasks.db           # the SQLite database file (git-ignored — auto-created on first run)
├── openapi.json       # OpenAPI spec used by Swagger UI at /docs
├── package.json
└── README.md
```

