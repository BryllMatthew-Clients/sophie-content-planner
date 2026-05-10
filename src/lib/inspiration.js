import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT     = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const INSP_PATH = path.join(ROOT, 'output', 'inspiration.json');
const KW_PATH   = path.join(ROOT, 'output', 'keywords.json');

function readJson(p, def) {
  if (!fs.existsSync(p)) return def;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return def; }
}
function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function detectPlatform(url) {
  if (/instagram\.com/i.test(url))           return 'instagram';
  if (/linkedin\.com/i.test(url))            return 'linkedin';
  if (/facebook\.com|fb\.com/i.test(url))    return 'facebook';
  if (/youtube\.com|youtu\.be/i.test(url))   return 'youtube';
  if (/tiktok\.com/i.test(url))              return 'tiktok';
  if (/twitter\.com|x\.com/i.test(url))      return 'twitter';
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

// ── Inspiration CRUD ────────────────────────────────────────────
export function readInspirations() {
  return readJson(INSP_PATH, { sources: [] });
}

export async function addInspiration({ url, label }) {
  const meta = await fetchUrlMetadata(url);
  const source = {
    id: crypto.randomUUID(),
    url,
    label: label?.trim() || null,
    platform: detectPlatform(url),
    title: meta.title,
    description: meta.description,
    addedAt: new Date().toISOString(),
  };
  const data = readInspirations();
  data.sources.push(source);
  writeJson(INSP_PATH, data);
  return source;
}

export function removeInspiration(id) {
  const data = readInspirations();
  data.sources = data.sources.filter(s => s.id !== id);
  writeJson(INSP_PATH, data);
}

// ── Keywords CRUD ───────────────────────────────────────────────
export function readKeywords() {
  return readJson(KW_PATH, { keywords: [] });
}

export function addKeyword(keyword) {
  const data = readKeywords();
  const entry = { id: crypto.randomUUID(), keyword: keyword.trim(), addedAt: new Date().toISOString() };
  data.keywords.push(entry);
  writeJson(KW_PATH, data);
  return entry;
}

export function removeKeyword(id) {
  const data = readKeywords();
  data.keywords = data.keywords.filter(k => k.id !== id);
  writeJson(KW_PATH, data);
}

// ── Context builders for AI prompts ─────────────────────────────
export function buildInspirationContext() {
  const { sources } = readInspirations();
  const useful = sources.filter(s => s.title || s.description || s.label);
  if (!useful.length) return '';
  const lines = useful.map(s => {
    const name = s.label || s.url;
    const info = [s.title, s.description].filter(Boolean).join(' — ');
    return `  • ${s.platform.toUpperCase()} | ${name}${info ? ': ' + info : ''}`;
  }).join('\n');
  return `\n\nStyle inspiration from similar creators in this niche — study their depth and authority, but all content must be 100% original:\n${lines}\n`;
}

export function getCustomKeywords() {
  return readKeywords().keywords.map(k => k.keyword).filter(Boolean);
}
