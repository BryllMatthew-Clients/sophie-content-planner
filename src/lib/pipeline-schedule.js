import { getDb } from './db.js';

const COLL = 'schedule';
const DOC_ID = 'config';

const DEFAULTS = {
  enabled: false,
  hour: 9,
  minute: 0,
  timezone: 'America/Chicago',
  lastRun: null,
};

export async function readScheduleConfig() {
  try {
    const db = await getDb();
    const doc = await db.collection(COLL).findOne({ _id: DOC_ID });
    return { ...DEFAULTS, ...(doc ?? {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function writeScheduleConfig(config) {
  const db = await getDb();
  await db.collection(COLL).updateOne(
    { _id: DOC_ID },
    { $set: { ...config, _id: DOC_ID } },
    { upsert: true }
  );
}

export async function markLastRun() {
  try {
    const db = await getDb();
    await db.collection(COLL).updateOne(
      { _id: DOC_ID },
      { $set: { lastRun: new Date().toISOString() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[Schedule] Could not mark last run:', err.message);
  }
}
