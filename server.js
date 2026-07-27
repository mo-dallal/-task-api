

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const db = require('./db');
const app = express();
const PORT = 3000;

app.use(express.json()); // parses JSON request bodies into req.body
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Converts a raw SQLite row (done stored as 0/1) into the JSON shape the API returns.
function toTaskJson(row) {
  return {
    id: row.id,
    title: row.title,
    done: !!row.done,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

app.get('/', (req, res) => {
  res.json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/tasks', (req, res) => {
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  // ?done=true or ?done=false — filter by completion status
  if (req.query.done !== undefined) {
    sql += ' AND done = ?';
    params.push(req.query.done === 'true' ? 1 : 0);
  }

  // ?search=milk — case-insensitive substring match on title, via SQL LIKE
  if (req.query.search) {
    sql += ' AND title LIKE ? COLLATE NOCASE';
    params.push(`%${req.query.search}%`);
  }

  // ?sort=title — alphabetical ordering (optional extra)
  if (req.query.sort === 'title') {
    sql += ' ORDER BY title COLLATE NOCASE ASC';
  } else {
    sql += ' ORDER BY id ASC';
  }

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(toTaskJson));
});

app.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM tasks').get().c;
  const done = db.prepare('SELECT COUNT(*) AS c FROM tasks WHERE done = 1').get().c;
  res.json({ total, done, open: total - done });
});

app.post('/reset', (req, res) => {
  db.exec('DELETE FROM tasks');
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'tasks'"); // restart id numbering at 1
  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insert.run('Buy milk', 0);
  insert.run('Write README', 0);
  insert.run('Walk the dog', 1);
  const rows = db.prepare('SELECT * FROM tasks ORDER BY id ASC').all();
  res.json({ message: 'Tasks reset to seed data', tasks: rows.map(toTaskJson) });
});

app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  res.json(toTaskJson(row));
});

app.post('/tasks', (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }

  const result = db.prepare('INSERT INTO tasks (title, done) VALUES (?, 0)').run(title.trim());
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(toTaskJson(row));
});

app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const { title, done } = req.body || {};
  const titleProvided = title !== undefined;
  const doneProvided = done !== undefined;

  if (!titleProvided && !doneProvided) {
    return res.status(400).json({ error: 'request body must include title and/or done' });
  }
  if (titleProvided && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  if (doneProvided && typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done must be a boolean' });
  }

  const newTitle = titleProvided ? title.trim() : existing.title;
  const newDone = doneProvided ? (done ? 1 : 0) : existing.done;

  db.prepare("UPDATE tasks SET title = ?, done = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newTitle, newDone, id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(toTaskJson(updated));
});

app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
