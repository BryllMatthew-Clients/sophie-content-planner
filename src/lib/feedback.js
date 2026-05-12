import { readDb, writeDb } from './storage.js';

const DB = 'feedback';

export function saveFeedback(id, reason) {
  if (!reason?.trim()) return;
  const store = readDb(DB);
  store[id] = { reason: reason.trim(), at: new Date().toISOString() };
  writeDb(DB, store);
}

export function getFeedback(id) {
  const entry = readDb(DB)[id];
  return entry?.reason ?? null;
}

export function getAllFeedback() {
  const store = readDb(DB);
  const out = {};
  for (const [id, v] of Object.entries(store)) out[id] = v?.reason ?? v;
  return out;
}

// Returns a prompt snippet telling Claude what to avoid based on past rejections.
// Pass a type (e.g. 'linkedin') to scope to that platform, or omit for all.
export function buildFeedbackPrompt(type) {
  const store = readDb(DB);
  const entries = Object.entries(store)
    .filter(([id]) => !type || id === type || id.startsWith(`${type}-`))
    .map(([, v]) => (typeof v === 'string' ? v : v?.reason))
    .filter(Boolean);
  if (!entries.length) return '';
  return `\n\nLEARNING FROM PAST REJECTIONS — do NOT repeat these patterns in new content:\n${entries.map(r => `  • ${r}`).join('\n')}\n`;
}
