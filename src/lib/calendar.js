import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readLatestOutput, readLatestJson } from './storage.js';
import { readApprovals } from './approvals.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const SCHEDULE_PATH = path.join(ROOT, 'output', 'schedule.json');
const OUTPUT_TYPES = ['linkedin', 'facebook', 'instagram', 'youtube'];

// ── Parsers ───────────────────────────────────────────────────

function parseLinkedIn(md) {
  if (!md) return [];
  const posts = [];
  for (const sec of md.split(/\n---\n/)) {
    const m = sec.match(/## Post (\d+) of \d+ [—–-] (.+)/);
    if (!m) continue;
    posts.push({ type: 'linkedin', index: parseInt(m[1]), title: m[2].replace(/\*\*/g, '').trim(), content: sec.trim() });
  }
  return posts;
}

function parseFacebook(md) {
  if (!md) return [];
  const posts = [];
  for (const sec of md.split(/\n---\n/)) {
    const m = sec.match(/## Facebook Post (\d+) of \d+ [—–-] (.+)/);
    if (!m) continue;
    posts.push({ type: 'facebook', index: parseInt(m[1]), title: m[2].replace(/\*\*/g, '').trim(), content: sec.trim() });
  }
  return posts;
}

function parseInstagram(md) {
  if (!md) return [];
  const posts = [];
  for (const sec of md.split(/\n---\n/)) {
    const m = sec.match(/## Instagram Post (\d+) of \d+ [—–-] (.+)/);
    if (!m) continue;
    posts.push({ type: 'instagram', index: parseInt(m[1]), title: m[2].replace(/\*\*/g, '').trim(), content: sec.trim() });
  }
  return posts;
}

function parseYouTube(md) {
  if (!md) return [];
  const plans = [];
  // Handle both formats
  const sections = md.split(/(?=\*\*Video Plan \d+|^## (?:Video|YouTube Topic) \d+)/m);
  for (const sec of sections) {
    let m = sec.match(/\*\*Video Plan (\d+)[:\s]+(.+?)(?:\*\*|$)/m);
    if (!m) m = sec.match(/## (?:Video|YouTube Topic) (\d+)[:\s]+(.+)/);
    if (!m) continue;
    plans.push({ type: 'youtube', index: parseInt(m[1]), title: m[2].replace(/\*\*/g, '').trim(), content: sec.trim() });
  }
  return plans;
}

// ── Scheduler ─────────────────────────────────────────────────

function getStartMonday(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  const day = d.getDay();
  const snap = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + snap);
  return d;
}

function toISO(date) { return date.toISOString().slice(0, 10); }

function assignDates(items, weekDayOffsets, startMonday) {
  let week = 0, slot = 0;
  return items.map(item => {
    const offset = week * 7 + weekDayOffsets[slot];
    const d = new Date(startMonday);
    d.setDate(d.getDate() + offset);
    slot++;
    if (slot >= weekDayOffsets.length) { slot = 0; week++; }
    return { ...item, date: toISO(d), id: `${item.type}-${item.index}` };
  });
}

// ── Image URL attachment ──────────────────────────────────────

function attachImages(events, liImageIndex, igImageIndex) {
  return events.map(ev => {
    if ((ev.type === 'linkedin' || ev.type === 'facebook') && liImageIndex?.[ev.index]) {
      return { ...ev, imageUrl: liImageIndex[ev.index].square };
    }
    if (ev.type === 'instagram' && igImageIndex?.[ev.index]) {
      return { ...ev, imageUrl: igImageIndex[ev.index].portrait };
    }
    return ev;
  });
}

// ── Cache invalidation ────────────────────────────────────────

function latestOutputMtime() {
  let latest = 0;
  for (const type of OUTPUT_TYPES) {
    const dir = path.join(ROOT, 'output', type);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md') && !f.endsWith('.json')) continue;
      const mtime = fs.statSync(path.join(dir, f)).mtimeMs;
      if (mtime > latest) latest = mtime;
    }
  }
  return latest;
}

// ── Public API ────────────────────────────────────────────────

export function getSchedule() {
  if (fs.existsSync(SCHEDULE_PATH)) {
    const schedMtime = fs.statSync(SCHEDULE_PATH).mtimeMs;
    if (schedMtime >= latestOutputMtime()) {
      return JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));
    }
  }
  return regenerateSchedule();
}

export function regenerateSchedule() {
  const linkedin  = parseLinkedIn(readLatestOutput('linkedin'));
  const facebook  = parseFacebook(readLatestOutput('facebook'));
  const instagram = parseInstagram(readLatestOutput('instagram'));
  const youtube   = parseYouTube(readLatestOutput('youtube'));

  const liImageIndex = readLatestJson('linkedin');
  const igImageIndex = readLatestJson('instagram');

  const today = new Date().toISOString().slice(0, 10);
  const startMonday = getStartMonday(today);

  // Cadence: LinkedIn Mon/Wed/Fri · Facebook Tue/Thu · Instagram Sun · YouTube Sat
  let events = [
    ...assignDates(linkedin,  [0, 2, 4], startMonday),
    ...assignDates(facebook,  [1, 3],    startMonday),
    ...assignDates(instagram, [6],       startMonday),
    ...assignDates(youtube,   [5],       startMonday),
  ].sort((a, b) => a.date.localeCompare(b.date));

  events = attachImages(events, liImageIndex, igImageIndex);

  // Filter to only approved items when an approvals file exists
  const approvals = readApprovals();
  if (Object.keys(approvals).length > 0) {
    events = events.filter(ev => approvals[ev.id] === 'approved');
  }

  const schedule = { generatedAt: new Date().toISOString(), startDate: toISO(startMonday), events };
  fs.mkdirSync(path.join(ROOT, 'output'), { recursive: true });
  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2));
  return schedule;
}
