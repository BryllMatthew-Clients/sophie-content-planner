import { readDb, writeDb } from './storage.js';

const DB = 'history';

function getRecentEntries(days) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const store = readDb(DB);
  return Object.entries(store)
    .filter(([date]) => date >= cutoff)
    .map(([, entry]) => entry);
}

export function getRecentTopics(days = 30) {
  return getRecentEntries(days).flatMap(e => e.topics ?? []);
}

export function getRecentAngles(days = 14) {
  return getRecentEntries(days).flatMap(e => e.angles ?? []);
}

export function buildAvoidList(days = 30) {
  const topics = getRecentTopics(days);
  if (!topics.length) return '';
  return `\n\nIMPORTANT — Recently covered topics (do NOT repeat or closely overlap with these):\n${topics.map(t => `  • ${t}`).join('\n')}\n`;
}

export function recordGeneration({ topics = [], angles = [] }) {
  const date = new Date().toISOString().slice(0, 10);
  const store = readDb(DB);
  store[date] = { topics, angles };
  // Trim entries older than 90 days
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  for (const key of Object.keys(store)) {
    if (key < cutoff) delete store[key];
  }
  writeDb(DB, store);
}
