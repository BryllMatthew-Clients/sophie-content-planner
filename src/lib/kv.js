import fetch from 'node-fetch';

const BASE  = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function enabled() { return !!(BASE && TOKEN); }

export async function kvGet(key) {
  if (!enabled()) return null;
  try {
    const res  = await fetch(`${BASE}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const data = await res.json();
    if (data.result == null) return null;
    let parsed = JSON.parse(data.result);
    // Handle legacy double-stringified values from earlier bug
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch {}
    }
    return parsed;
  } catch { return null; }
}

export async function kvSet(key, value) {
  if (!enabled()) return;
  try {
    // Store as plain-text JSON string — single stringify, no double-encoding
    await fetch(`${BASE}/set/${encodeURIComponent(key)}`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'text/plain' },
      body:    JSON.stringify(value),
    });
  } catch (e) { console.error(`[KV] set failed for ${key}:`, e.message); }
}
