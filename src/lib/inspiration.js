import crypto from 'crypto';
import { getDb } from './db.js';

const COLL_INS = 'inspirations';
const COLL_KW  = 'keywords';

function detectPlatform(url) {
  if (/instagram\.com/i.test(url))          return 'instagram';
  if (/linkedin\.com/i.test(url))           return 'linkedin';
  if (/facebook\.com|fb\.com/i.test(url))   return 'facebook';
  if (/youtube\.com|youtu\.be/i.test(url))  return 'youtube';
  if (/tiktok\.com/i.test(url))             return 'tiktok';
  if (/twitter\.com|x\.com/i.test(url))     return 'twitter';
  return 'web';
}

export async function fetchUrlMetadata(url) {
  try {
    const { default: fetch } = await import('node-fetch');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return { title: null, description: null };
    const html = await res.text();
    const pick = (...patterns) => {
      for (const p of patterns) { const m = html.match(p); if (m?.[1]) return m[1].replace(/\s+/g, ' ').trim(); }
      return null;
    };
    const title = pick(
      /<meta\s+property="og:title"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+property="og:title"/i,
      /<title[^>]*>([^<]+)<\/title>/i
    )?.slice(0, 150);
    const description = pick(
      /<meta\s+property="og:description"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+property="og:description"/i,
      /<meta\s+name="description"\s+content="([^"]+)"/i
    )?.slice(0, 400);
    return { title: title || null, description: description || null };
  } catch {
    return { title: null, description: null };
  }
}

// ── Inspiration CRUD ─────────────────────────────────────────────
export async function readInspirations() {
  const db = await getDb();
  const sources = await db.collection(COLL_INS).find().sort({ addedAt: -1 }).toArray();
  return { sources };
}

export async function addInspiration({ url, label }) {
  const meta = await fetchUrlMetadata(url);
  const source = {
    _id: crypto.randomUUID(),
    id:  crypto.randomUUID(),
    url,
    label: label?.trim() || null,
    platform: detectPlatform(url),
    title: meta.title,
    description: meta.description,
    addedAt: new Date().toISOString(),
  };
  source.id = source._id; // keep id field in sync with _id
  const db = await getDb();
  await db.collection(COLL_INS).insertOne(source);
  return source;
}

export async function removeInspiration(id) {
  const db = await getDb();
  await db.collection(COLL_INS).deleteOne({ _id: id });
}

// ── Keywords CRUD ────────────────────────────────────────────────
export async function readKeywords() {
  const db = await getDb();
  const keywords = await db.collection(COLL_KW).find().sort({ addedAt: -1 }).toArray();
  return { keywords };
}

export async function addKeyword(keyword) {
  const id = crypto.randomUUID();
  const entry = { _id: id, id, keyword: keyword.trim(), addedAt: new Date().toISOString() };
  const db = await getDb();
  await db.collection(COLL_KW).insertOne(entry);
  return entry;
}

export async function removeKeyword(id) {
  const db = await getDb();
  await db.collection(COLL_KW).deleteOne({ _id: id });
}

// ── Context builders for AI prompts ──────────────────────────────
export async function buildInspirationContext() {
  const { sources } = await readInspirations();
  const useful = sources.filter(s => s.title || s.description || s.label);
  if (!useful.length) return '';
  const lines = useful.map(s => {
    const name = s.label || s.url;
    const info = [s.title, s.description].filter(Boolean).join(' — ');
    return `  • ${s.platform.toUpperCase()} | ${name}${info ? ': ' + info : ''}`;
  }).join('\n');
  return `\n\nStyle inspiration from similar creators in this niche — study their depth and authority, but all content must be 100% original:\n${lines}\n`;
}

export async function getCustomKeywords() {
  const { keywords } = await readKeywords();
  return keywords.map(k => k.keyword).filter(Boolean);
}
