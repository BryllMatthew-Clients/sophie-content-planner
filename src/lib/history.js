import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HISTORY_PATH = path.join(ROOT, 'output', 'content-history.json');

function read() {
  if (!fs.existsSync(HISTORY_PATH)) return { entries: [] };
  try { return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8')); }
  catch { return { entries: [] }; }
}

function write(data) {
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(data, null, 2));
}

// Returns topic strings from the last N days
export function getRecentTopics(days = 30) {
  const cutoff = Date.now() - days * 86400000;
  return read().entries
    .filter(e => new Date(e.date).getTime() >= cutoff)
    .flatMap(e => e.topics ?? []);
}

// Returns angle strings used in the last N days
export function getRecentAngles(days = 14) {
  const cutoff = Date.now() - days * 86400000;
  return read().entries
    .filter(e => new Date(e.date).getTime() >= cutoff)
    .flatMap(e => e.angles ?? []);
}

// Returns a human-readable "avoid" list for prompts
export function buildAvoidList(days = 30) {
  const topics = getRecentTopics(days);
  if (!topics.length) return '';
  return `\n\nIMPORTANT — Recently covered topics (do NOT repeat or closely overlap with these):\n${topics.map(t => `  • ${t}`).join('\n')}\n`;
}

// Call after each generation run
export function recordGeneration({ topics = [], angles = [] }) {
  const data = read();
  const date = new Date().toISOString().slice(0, 10);
  data.entries = data.entries.filter(e => e.date !== date); // replace today's entry
  data.entries.push({ date, topics, angles });
  // Trim to last 90 days
  const cutoff = Date.now() - 90 * 86400000;
  data.entries = data.entries.filter(e => new Date(e.date).getTime() >= cutoff);
  write(data);
}
