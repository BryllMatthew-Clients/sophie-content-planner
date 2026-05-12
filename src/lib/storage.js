import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { kvGet, kvSet } from './kv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

export function getOutputDir() {
  return process.env.OUTPUT_DIR
    ? path.resolve(process.env.OUTPUT_DIR)
    : path.join(PROJECT_ROOT, 'output');
}

function dbFile(name) {
  return path.join(getOutputDir(), '.db', `${name}.json`);
}

// ── In-memory store (populated on init, stays in sync on writes) ──
const mem = {};

// Call once on startup — loads all collections from Upstash (or local files)
const DB_NAMES = ['outputs', 'approvals', 'captions', 'history', 'schedule', 'inspiration', 'feedback'];

export async function initStore() {
  await Promise.all(DB_NAMES.map(async name => {
    const remote = await kvGet(`sophie:db:${name}`);
    if (remote != null) {
      mem[name] = remote;
      // Also write to local file so scripts that run outside the server have it
      _writeLocalFile(name, remote);
    } else {
      mem[name] = _readLocalFile(name);
    }
  }));
}

function _readLocalFile(name) {
  try { return JSON.parse(fs.readFileSync(dbFile(name), 'utf8')); }
  catch { return null; }
}

function _writeLocalFile(name, data) {
  try {
    const f = dbFile(name);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

// Always read from the local file so the server picks up writes made by
// generation child processes (which have a separate in-memory store).
// Fall back to in-memory only when the file doesn't exist yet.
export function readDb(name) {
  const fromFile = _readLocalFile(name);
  if (fromFile != null) { mem[name] = fromFile; return fromFile; }
  if (mem[name] == null) mem[name] = {};
  return mem[name];
}

// Synchronous write — updates memory + local file, then syncs to Upstash in background
export function writeDb(name, data) {
  mem[name] = data;
  _writeLocalFile(name, data);
  kvSet(`sophie:db:${name}`, data); // fire-and-forget background sync
}

// ── Output dirs ───────────────────────────────────────────────────
export function ensureOutputDirs() {
  const base = getOutputDir();
  for (const sub of ['images']) {
    fs.mkdirSync(path.join(base, sub, 'linkedin'),  { recursive: true });
    fs.mkdirSync(path.join(base, sub, 'instagram'), { recursive: true });
  }
}

export function readLatestJson(type) {
  const dir = path.join(getOutputDir(), type);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  if (!files.length) return null;
  try { return JSON.parse(fs.readFileSync(path.join(dir, files[files.length - 1]), 'utf8')); }
  catch { return null; }
}

export function writeOutput(type, content) {
  const store = readDb('outputs');
  store[type] = { content, generatedAt: new Date().toISOString() };
  writeDb('outputs', store);
  return `db://outputs/${type}`;
}

export function readLatestOutput(type) {
  return readDb('outputs')[type]?.content ?? null;
}

export function readPrompt(filename) {
  return fs.readFileSync(path.join(PROJECT_ROOT, 'prompts', filename), 'utf8');
}

export function readClaudeMd() {
  return fs.readFileSync(path.join(PROJECT_ROOT, 'CLAUDE.md'), 'utf8');
}

