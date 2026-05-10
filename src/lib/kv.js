// Upstash Redis REST client — used for persistent storage across deploys
// Falls back silently if env vars are not set (local dev uses file storage only)

const BASE = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function enabled() { return !!(BASE && TOKEN); }

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
  });
  return res.json();
}

export async function kvGet(key) {
  if (!enabled()) return null;
  try {
    const data = await req(`/get/${encodeURIComponent(key)}`);
    return data.result != null ? JSON.parse(data.result) : null;
  } catch { return null; }
}

export async function kvSet(key, value) {
  if (!enabled()) return;
  try {
    await req(`/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      body: JSON.stringify(JSON.stringify(value)),
    });
  } catch (e) { console.error(`[KV] set failed for ${key}:`, e.message); }
}
