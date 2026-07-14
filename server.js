const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json()); // parses JSON request bodies into req.body

// In-memory "database" — resets every time the server restarts.
let tasks = [
  { id: 1, title: 'Buy milk', done: false },
  { id: 2, title: 'Write README', done: false },
  { id: 3, title: 'Walk the dog', done: true }
];
let nextId = 4;

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
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  res.json(task);
});

app.post('/tasks', (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }

  const newTask = { id: nextId++, title: title.trim(), done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
