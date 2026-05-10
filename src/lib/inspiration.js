import crypto from 'crypto';
import { getDb } from './db.js';

const COLL_INS = 'inspirations';
const COLL_KW  = 'keywords';

function detectPlatform(url) {
  if (/instagram\.com/i.test(url))         return 'instagram';
  if (/linkedin\.com/i.test(url))          return 'linkedin';
  if (/facebook\.com|fb\.com/i.test(url))  return 'facebook';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/tiktok\.com/i.test(url))            return 'tiktok';
  if (/twitter\.com|x\.com/i.test(url))    return 'twitter';
  return 'web';
}

// ── Inspiration CRUD ─────────────────────────────────────────────
export async function readInspirations() {
  const db = await getDb();
  const sources = await db.collection(COLL_INS).find().sort({ addedAt: -1 }).toArray();
  return { sources };
}

export async function addInspiration({ url, label }) {
  const id = crypto.randomUUID();
  const source = {
    _id: id,
    id,
    url,
    label: label?.trim() || null,
    platform: detectPlatform(url),
    addedAt: new Date().toISOString(),
  };
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

// ── Page content scraper (used at research time) ─────────────────
async function fetchPageContent(url) {
  try {
    const { default: fetch } = await import('node-fetch');
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? '';

    const contentHtml = html
      .replace(/<(script|style|nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<\/(p|h[1-6]|li|blockquote|td)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 40)
      .slice(0, 60)
      .join('\n');

    if (!contentHtml && !title) return null;
    return [title, contentHtml].filter(Boolean).join('\n').slice(0, 2500);
  } catch {
    return null;
  }
}

// ── Context builders for AI prompts ──────────────────────────────

// Used by generators — lightweight list of sources
export async function buildInspirationContext() {
  const { sources } = await readInspirations();
  if (!sources.length) return '';
  const lines = sources.map(s => {
    const name = s.label || s.url;
    return `  • ${s.platform.toUpperCase()} | ${name}`;
  }).join('\n');
  return `\n\nStyle inspiration sources (use for tone/format reference only):\n${lines}\n`;
}

// Used by research — fetches actual page content so Claude can study real posts
export async function buildInspirationContentForResearch() {
  const { sources } = await readInspirations();
  if (!sources.length) return '';

  console.log(`Fetching content from ${sources.length} inspiration source(s)...`);

  const fetched = await Promise.all(
    sources.map(async s => {
      const content = await fetchPageContent(s.url);
      const name = s.label || s.url;
      if (!content) {
        console.log(`  ↳ ${name}: blocked or unreachable — skipped`);
        return null;
      }
      console.log(`  ↳ ${name}: fetched`);
      return { name, platform: s.platform, content };
    })
  );

  const usable = fetched.filter(Boolean);
  if (!usable.length) return '';

  const sections = usable.map(s =>
    `### ${s.platform.toUpperCase()} — ${s.name}\n${s.content}`
  ).join('\n\n---\n\n');

  return `\n\n## Competitor & Inspiration Content\n\nThe following is real content scraped from competitor and inspiration accounts. Study the topics, hooks, angles, and pain points they address. Then generate **completely original** content ideas for Sophie — same audience problems, but rewritten entirely in Sophie's voice with her unique tax strategy expertise. Do NOT reproduce any specific wording, sentences, or structures from the examples below.\n\n${sections}\n`;
}

export async function getCustomKeywords() {
  const { keywords } = await readKeywords();
  return keywords.map(k => k.keyword).filter(Boolean);
}
