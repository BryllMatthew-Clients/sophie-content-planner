import 'dotenv/config';
import express from 'express';
import { spawn } from 'child_process';
import { readLatestOutput, ensureOutputDirs } from './lib/storage.js';
import { getSchedule, regenerateSchedule } from './lib/calendar.js';
import { readApprovals, setApproval, bulkSetApproval } from './lib/approvals.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const ROOT  = path.join(__dirname, '..');

// CORS — allow the Vercel frontend and localhost to call this API
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]);

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const SCRIPTS = {
  research:  'src/research.js',
  linkedin:  'src/generate-linkedin.js',
  facebook:  'src/generate-facebook.js',
  instagram: 'src/generate-instagram.js',
  youtube:   'src/youtube-planner.js',
};

const OUTPUT_TYPES = ['research', 'linkedin', 'facebook', 'instagram', 'youtube'];

const running = new Set();

app.use(express.static(path.join(ROOT, 'public')));
app.use('/images', express.static(path.join(ROOT, 'output', 'images')));

// GET /api/output/:type
app.get('/api/output/:type', (req, res) => {
  const { type } = req.params;
  if (!OUTPUT_TYPES.includes(type)) return res.status(400).json({ error: 'Unknown output type' });
  res.json({ content: readLatestOutput(type) ?? null });
});

// GET /api/approvals
app.get('/api/approvals', (req, res) => res.json(readApprovals()));

// POST /api/approvals/bulk/:type  — must be before /:id to avoid route conflict
app.post('/api/approvals/bulk/:type', express.json(), (req, res) => {
  const { status } = req.body ?? {};
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  res.json(bulkSetApproval(req.params.type, status));
});

// POST /api/approvals/:id
app.post('/api/approvals/:id', express.json(), (req, res) => {
  const { status } = req.body ?? {};
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  res.json(setApproval(req.params.id, status));
});

// GET /api/calendar
app.get('/api/calendar', (req, res) => {
  try { res.json(getSchedule()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/calendar/regenerate
app.post('/api/calendar/regenerate', (req, res) => {
  try { res.json(regenerateSchedule()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/status
app.get('/api/status', (req, res) => {
  const outputs = {};
  for (const type of OUTPUT_TYPES) outputs[type] = readLatestOutput(type) !== null;
  res.json({ ollamaModel: process.env.OLLAMA_MODEL || null, mock: process.env.MOCK === 'true', outputs });
});

// GET /api/run/:script — SSE
app.get('/api/run/:script', (req, res) => {
  const { script } = req.params;
  if (script === 'all') return runSequence(['research', 'linkedin', 'instagram', 'facebook', 'youtube'], res);
  if (!SCRIPTS[script]) { res.status(400).end('Unknown script'); return; }
  if (running.has(script)) { res.status(409).end('Already running'); return; }
  runScript(script, res);
});

function sseHeader(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
}

function sseSend(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function runScript(name, res) {
  sseHeader(res);
  running.add(name);
  sseSend(res, 'start', { script: name });
  const child = spawn(process.execPath, [SCRIPTS[name]], { env: { ...process.env }, cwd: ROOT });
  child.stdout.on('data', d => sseSend(res, 'log', { text: d.toString() }));
  child.stderr.on('data', d => sseSend(res, 'log', { text: d.toString() }));
  child.on('close', code => { running.delete(name); sseSend(res, 'done', { script: name, code }); res.end(); });
  res.on('close', () => { if (child.exitCode === null) { child.kill(); running.delete(name); } });
}

async function runSequence(names, res) {
  sseHeader(res);
  sseSend(res, 'start', { script: 'all' });
  for (const name of names) {
    if (!SCRIPTS[name]) continue;
    running.add(name);
    sseSend(res, 'log', { text: `\n▶ Running ${name}...\n` });
    await new Promise(resolve => {
      const child = spawn(process.execPath, [SCRIPTS[name]], { env: { ...process.env }, cwd: ROOT });
      child.stdout.on('data', d => sseSend(res, 'log', { text: d.toString() }));
      child.stderr.on('data', d => sseSend(res, 'log', { text: d.toString() }));
      child.on('close', code => { running.delete(name); sseSend(res, 'step', { script: name, code }); resolve(); });
    });
  }
  sseSend(res, 'done', { script: 'all', code: 0 });
  res.end();
}

ensureOutputDirs();
app.listen(PORT, () => console.log(`Sophie's Automated Content Planner → http://localhost:${PORT}`));
