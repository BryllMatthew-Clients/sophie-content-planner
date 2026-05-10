import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const COLL = 'outputs';

function getOutputDir() {
  return process.env.OUTPUT_DIR
    ? path.resolve(process.env.OUTPUT_DIR)
    : path.join(PROJECT_ROOT, 'output');
}

// Images and JSON indexes still go to disk
export function ensureOutputDirs() {
  const base = getOutputDir();
  for (const sub of ['images']) {
    fs.mkdirSync(path.join(base, sub, 'linkedin'),  { recursive: true });
    fs.mkdirSync(path.join(base, sub, 'instagram'), { recursive: true });
  }
}

// Image index JSON files (small, image-related — stay on disk)
export function readLatestJson(type) {
  const dir = path.join(getOutputDir(), type);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  if (!files.length) return null;
  try { return JSON.parse(fs.readFileSync(path.join(dir, files[files.length - 1]), 'utf8')); }
  catch { return null; }
}

// Generated markdown content → MongoDB
export async function writeOutput(type, content) {
  const generatedAt = new Date().toISOString();
  const db = await getDb();
  await db.collection(COLL).updateOne(
    { _id: type },
    { $set: { content, generatedAt } },
    { upsert: true }
  );
  return `mongodb://outputs/${type}`;
}

export async function readLatestOutput(type) {
  const db = await getDb();
  const doc = await db.collection(COLL).findOne({ _id: type });
  return doc?.content ?? null;
}

export function readPrompt(filename) {
  return fs.readFileSync(path.join(PROJECT_ROOT, 'prompts', filename), 'utf8');
}

export function readClaudeMd() {
  return fs.readFileSync(path.join(PROJECT_ROOT, 'CLAUDE.md'), 'utf8');
}
