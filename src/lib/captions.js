import { getDb } from './db.js';

const COLL = 'captions';

export async function readCaptions() {
  const db = await getDb();
  const docs = await db.collection(COLL).find().toArray();
  return Object.fromEntries(docs.map(d => [d._id, d.caption]));
}

export async function setCaption(id, caption) {
  const db = await getDb();
  await db.collection(COLL).updateOne({ _id: id }, { $set: { caption } }, { upsert: true });
  return readCaptions();
}

export async function deleteCaption(id) {
  const db = await getDb();
  await db.collection(COLL).deleteOne({ _id: id });
  return readCaptions();
}
