import { getDb } from './db.js';

const COLL = 'history';

async function getRecentEntries(days) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const db = await getDb();
  return db.collection(COLL).find({ _id: { $gte: cutoff } }).toArray();
}

export async function getRecentTopics(days = 30) {
  const entries = await getRecentEntries(days);
  return entries.flatMap(e => e.topics ?? []);
}

export async function getRecentAngles(days = 14) {
  const entries = await getRecentEntries(days);
  return entries.flatMap(e => e.angles ?? []);
}

export async function buildAvoidList(days = 30) {
  const topics = await getRecentTopics(days);
  if (!topics.length) return '';
  return `\n\nIMPORTANT — Recently covered topics (do NOT repeat or closely overlap with these):\n${topics.map(t => `  • ${t}`).join('\n')}\n`;
}

export async function recordGeneration({ topics = [], angles = [] }) {
  const date = new Date().toISOString().slice(0, 10);
  const db = await getDb();
  await db.collection(COLL).updateOne(
    { _id: date },
    { $set: { topics, angles } },
    { upsert: true }
  );
  // Trim entries older than 90 days
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  await db.collection(COLL).deleteMany({ _id: { $lt: cutoff } });
}
