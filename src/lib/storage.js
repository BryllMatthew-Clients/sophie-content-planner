import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function readDb(name) {
  try { return JSON.parse(fs.readFileSync(dbFile(name), 'utf8')); }
  catch { return {}; }
}

function writeDb(name, data) {
  const f = dbFile(name);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf8');
}

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
  return `file://outputs/${type}`;
}

export function readLatestOutput(type) {
  const store = readDb('outputs');
  return store[type]?.content ?? null;
}

export function readPrompt(filename) {
  return fs.readFileSync(path.join(PROJECT_ROOT, 'prompts', filename), 'utf8');
}

export function readClaudeMd() {
  return fs.readFileSync(path.join(PROJECT_ROOT, 'CLAUDE.md'), 'utf8');
}

// Exposed so other libs can share the same .db directory
export { readDb, writeDb };
