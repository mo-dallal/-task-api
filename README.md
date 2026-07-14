# Task API

A small in-memory CRUD API for managing a to-do list, built with Node.js and Express as part of W2 · A1.

## What this is

A REST API with five main endpoints (list, get one, create, update, delete) plus a couple of extras
(search/filter, stats, reset). Data lives in a plain in-memory array — no database yet — so it resets
every time the server restarts. Interactive API docs are served via Swagger UI.

## How to install & run

```bash
npm install && node server.js
```

The server starts on **http://localhost:3000**. Interactive docs are at **http://localhost:3000/docs**.

## Endpoints

| Method | Path             | Description                                  | Success | Errors        |
|--------|------------------|-----------------------------------------------|---------|---------------|
| GET    | `/`              | API info (name, version, endpoints)           | 200     | —             |
| GET    | `/health`        | Health check                                   | 200     | —             |
| GET    | `/tasks`         | List all tasks (supports `?done=` & `?search=`)| 200     | —             |
| GET    | `/tasks/:id`     | Get one task                                   | 200     | 404           |
| POST   | `/tasks`         | Create a task (`{ "title": "..." }`)           | 201     | 400           |
| PUT    | `/tasks/:id`     | Update a task's `title` and/or `done`          | 200     | 400, 404      |
| DELETE | `/tasks/:id`     | Delete a task                                  | 204     | 404           |
| GET    | `/stats`         | `{ total, done, open }` counts                 | 200     | —             |
| POST   | `/reset`         | Restore the 3 seed tasks                       | 200     | —             |

## Example: full CRUD cycle via curl

```bash
$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy milk"}'
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":false}

$ curl -i -X PUT http://localhost:3000/tasks/4 -H "Content-Type: application/json" -d '{"done":true}'
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":true}

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

## The mortality experiment

I created a 4th task (`"This will vanish"`), confirmed it showed up in `GET /tasks`, then killed and
restarted the server and called `GET /tasks` again. The new task was gone — the list was back to just
the 3 original seed tasks.

**Why:** the task list is a plain JavaScript array (`let tasks = [...]`) living in the server process's
memory. Nothing ever writes it to disk, so as soon as the process exits, that memory — and every task
created since the last restart — is gone. This is exactly why Week 3 introduces a real database: it's
the fix for data that needs to outlive the process.

## Extras implemented

- `GET /tasks?done=true` — filter by completion status
- `GET /tasks?search=milk` — case-insensitive title search
- `GET /stats` — `{ total, done, open }`
- `POST /reset` — restore the 3 seed tasks

## Project structure

```
task-api/
├── server.js       # the whole API
├── openapi.json     # OpenAPI spec used by Swagger UI at /docs
├── package.json
└── README.md
```
