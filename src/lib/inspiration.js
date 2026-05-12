import crypto from 'crypto';
import { readDb, writeDb } from './storage.js';

const DB = 'inspiration';

function readData() {
  const data = readDb(DB);
  return {
    sources:  Array.isArray(data?.sources)  ? data.sources  : [],
    keywords: Array.isArray(data?.keywords) ? data.keywords : [],
  };
}

function writeData(data) {
  writeDb(DB, data);
}

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
export function readInspirations() {
  const { sources } = readData();
  return { sources: [...sources].sort((a, b) => b.addedAt.localeCompare(a.addedAt)) };
}

export function addInspiration({ url, label }) {
  const data = readData();
  const source = { id: crypto.randomUUID(), url, label: label?.trim() || null, platform: detectPlatform(url), addedAt: new Date().toISOString() };
  data.sources.push(source);
  writeData(data);
  return source;
}

export function removeInspiration(id) {
  const data = readData();
  data.sources = data.sources.filter(s => s.id !== id);
  writeData(data);
}

// ── Keywords CRUD ────────────────────────────────────────────────
export function readKeywords() {
  const { keywords } = readData();
  return { keywords: [...keywords].sort((a, b) => b.addedAt.localeCompare(a.addedAt)) };
}

export function addKeyword(keyword) {
  const data = readData();
  const entry = { id: crypto.randomUUID(), keyword: keyword.trim(), addedAt: new Date().toISOString() };
  data.keywords.push(entry);
  writeData(data);
  return entry;
}

export function removeKeyword(id) {
  const data = readData();
  data.keywords = data.keywords.filter(k => k.id !== id);
  writeData(data);
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
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
    const text = html
      .replace(/<(script|style|nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<\/(p|h[1-6]|li|blockquote|td)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/[ \t]+/g, ' ')
      .split('\n').map(l => l.trim()).filter(l => l.length > 40)
      .slice(0, 60).join('\n');
    if (!text && !title) return null;
    return [title, text].filter(Boolean).join('\n').slice(0, 2500);
  } catch {
    return null;
  }
}

// ── Context builders for AI prompts ──────────────────────────────
export function buildInspirationContext() {
  const { sources } = readInspirations();
  if (!sources.length) return '';
  const lines = sources.map(s => `  • ${s.platform.toUpperCase()} | ${s.label || s.url}`).join('\n');
  return `\n\nStyle inspiration sources (use for tone/format reference only):\n${lines}\n`;
}

export async function buildInspirationContentForResearch() {
  const { sources } = readInspirations();
  if (!sources.length) return '';
  console.log(`Fetching content from ${sources.length} inspiration source(s)...`);
  const fetched = await Promise.all(sources.map(async s => {
    const content = await fetchPageContent(s.url);
    const name = s.label || s.url;
    if (!content) { console.log(`  ↳ ${name}: blocked or unreachable — skipped`); return null; }
    console.log(`  ↳ ${name}: fetched`);
    return { name, platform: s.platform, content };
  }));
  const usable = fetched.filter(Boolean);
  if (!usable.length) return '';
  const sections = usable.map(s => `### ${s.platform.toUpperCase()} — ${s.name}\n${s.content}`).join('\n\n---\n\n');
  return `\n\n## Competitor & Inspiration Content\n\nStudy the topics, hooks, and pain points below. Generate **completely original** content for Sophie — same audience problems, entirely rewritten in her voice. Do NOT copy any specific wording.\n\n${sections}\n`;
}

export function getCustomKeywords() {
  const { keywords } = readKeywords();
  return keywords.map(k => k.keyword).filter(Boolean);
}
