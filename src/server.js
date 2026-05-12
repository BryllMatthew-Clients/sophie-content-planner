import 'dotenv/config';
import express from 'express';
import { spawn } from 'child_process';
import cron from 'node-cron';
import { readLatestOutput, ensureOutputDirs, initStore } from './lib/storage.js';
import { getSchedule, regenerateSchedule } from './lib/calendar.js';
import { readApprovals, setApproval, bulkSetApproval } from './lib/approvals.js';
import { saveFeedback, getAllFeedback } from './lib/feedback.js';
import { readCaptions, setCaption, deleteCaption } from './lib/captions.js';
import { readScheduleConfig, writeScheduleConfig, markLastRun } from './lib/pipeline-schedule.js';
import { readInspirations, addInspiration, removeInspiration, readKeywords, addKeyword, removeKeyword } from './lib/inspiration.js';
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

// ── Background pipeline runner (no SSE — used by scheduler) ──────────────
function runPipelineBackground(names) {
  console.log(`[AutoPipeline] Starting: ${names.join(' → ')}`);
  let i = 0;
  function next() {
    if (i >= names.length) {
      markLastRun();
      console.log('[AutoPipeline] Complete.');
      return;
    }
    const name = names[i++];
    if (!SCRIPTS[name]) { next(); return; }
    if (running.has(name)) { console.log(`[AutoPipeline] ${name} already running — skipping.`); next(); return; }
    running.add(name);
    console.log(`[AutoPipeline] Running ${name}...`);
    const child = spawn(process.execPath, [SCRIPTS[name]], { env: { ...process.env }, cwd: ROOT });
    child.stdout.on('data', d => process.stdout.write(d));
    child.stderr.on('data', d => process.stderr.write(d));
    child.on('close', code => { running.delete(name); console.log(`[AutoPipeline] ${name} done (exit ${code})`); next(); });
  }
  next();
}

// ── Cron scheduler ────────────────────────────────────────────────────────
let scheduledTask = null;

function applySchedule(config) {
  if (scheduledTask) { scheduledTask.stop(); scheduledTask = null; }
  if (!config.enabled) { console.log('[Schedule] Disabled.'); return; }
  const expr = `${config.minute} ${config.hour} * * *`;
  scheduledTask = cron.schedule(expr, () => {
    console.log(`[Schedule] Triggered at ${config.hour}:${String(config.minute).padStart(2,'0')} ${config.timezone}`);
    runPipelineBackground(['research', 'linkedin', 'instagram', 'facebook']);
  }, { timezone: config.timezone });
  console.log(`[Schedule] Pipeline set for ${config.hour}:${String(config.minute).padStart(2,'0')} ${config.timezone} daily.`);
}

app.use(express.static(path.join(ROOT, 'public')));
app.use('/images', express.static(path.join(ROOT, 'output', 'images')));

// GET /api/output/:type
app.get('/api/output/:type', async (req, res) => {
  const { type } = req.params;
  if (!OUTPUT_TYPES.includes(type)) return res.status(400).json({ error: 'Unknown output type' });
  res.json({ content: (await readLatestOutput(type)) ?? null });
});

// GET /api/approvals
app.get('/api/approvals', async (req, res) => res.json(await readApprovals()));

// POST /api/approvals/bulk/:type  — must be before /:id to avoid route conflict
app.post('/api/approvals/bulk/:type', express.json(), async (req, res) => {
  const { status } = req.body ?? {};
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  res.json(await bulkSetApproval(req.params.type, status));
});

// POST /api/approvals/:id
app.post('/api/approvals/:id', express.json(), async (req, res) => {
  const { status, reason } = req.body ?? {};
  if (!['approved', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  if (status === 'rejected' && reason) saveFeedback(req.params.id, reason);
  res.json(await setApproval(req.params.id, status));
});

// GET /api/feedback
app.get('/api/feedback', (req, res) => res.json(getAllFeedback()));

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
app.get('/api/status', async (req, res) => {
  const outputs = {};
  await Promise.all(OUTPUT_TYPES.map(async t => { outputs[t] = (await readLatestOutput(t)) !== null; }));
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

// ── Inspiration & Keywords ────────────────────────────────────────────────
app.get('/api/inspiration', async (req, res) => {
  try { res.json(await readInspirations()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inspiration', express.json(), async (req, res) => {
  const { url, label } = req.body ?? {};
  if (!url) return res.status(400).json({ error: 'url required' });
  try { res.json(await addInspiration({ url, label })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/inspiration/:id', async (req, res) => {
  try { await removeInspiration(req.params.id); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/keywords', async (req, res) => {
  try { res.json(await readKeywords()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/keywords', express.json(), async (req, res) => {
  const { keyword } = req.body ?? {};
  if (!keyword?.trim()) return res.status(400).json({ error: 'keyword required' });
  try { res.json(await addKeyword(keyword)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/keywords/:id', async (req, res) => {
  try { await removeKeyword(req.params.id); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Captions (manual edits) ───────────────────────────────────────────────
app.get('/api/captions', async (req, res) => res.json(await readCaptions()));

app.post('/api/captions/:id', express.json(), async (req, res) => {
  const { caption } = req.body ?? {};
  if (caption == null) return res.status(400).json({ error: 'caption required' });
  res.json(await setCaption(req.params.id, caption));
});

app.delete('/api/captions/:id', async (req, res) => {
  res.json(await deleteCaption(req.params.id));
});

// GET /api/pipeline-schedule
app.get('/api/pipeline-schedule', async (req, res) => res.json(await readScheduleConfig()));

// POST /api/pipeline-schedule
app.post('/api/pipeline-schedule', express.json(), async (req, res) => {
  const { enabled, hour, minute, timezone } = req.body ?? {};
  const existing = await readScheduleConfig();
  const config = {
    ...existing,
    enabled: !!enabled,
    hour: Math.max(0, Math.min(23, parseInt(hour) || 9)),
    minute: Math.max(0, Math.min(59, parseInt(minute) || 0)),
    timezone: timezone || 'America/Chicago',
  };
  await writeScheduleConfig(config);
  applySchedule(config);
  res.json(config);
});

ensureOutputDirs();
initStore().then(() => {
  app.listen(PORT, () => console.log(`Sophie's Automated Content Planner → http://localhost:${PORT}`));
  try { applySchedule(readScheduleConfig()); } catch (err) { console.error('[Schedule] Could not load config:', err.message); }
}).catch(err => { console.error('[Store] Init failed:', err.message); process.exit(1); });
