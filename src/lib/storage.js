import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function getOutputDir() {
  return process.env.OUTPUT_DIR
    ? path.resolve(process.env.OUTPUT_DIR)
    : path.join(PROJECT_ROOT, 'output');
}

export function ensureOutputDirs() {
  const base = getOutputDir();
  for (const sub of ['research', 'linkedin', 'facebook', 'instagram', 'youtube']) {
    fs.mkdirSync(path.join(base, sub), { recursive: true });
  }
  fs.mkdirSync(path.join(base, 'images', 'linkedin'),  { recursive: true });
  fs.mkdirSync(path.join(base, 'images', 'instagram'), { recursive: true });
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
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(getOutputDir(), type);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${date}-${type}.md`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

export function readLatestOutput(type) {
  const dir = path.join(getOutputDir(), type);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .sort();
  if (!files.length) return null;
  const latest = path.join(dir, files[files.length - 1]);
  return fs.readFileSync(latest, 'utf8');
}

export function readPrompt(filename) {
  const promptPath = path.join(PROJECT_ROOT, 'prompts', filename);
  return fs.readFileSync(promptPath, 'utf8');
}

export function readClaudeMd() {
  return fs.readFileSync(path.join(PROJECT_ROOT, 'CLAUDE.md'), 'utf8');
}
