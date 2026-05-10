import { getDb } from './db.js';

const COLL = 'approvals';

export async function readApprovals() {
  const db = await getDb();
  const docs = await db.collection(COLL).find().toArray();
  return Object.fromEntries(docs.map(d => [d._id, d.status]));
}

export async function setApproval(id, status) {
  const db = await getDb();
  await db.collection(COLL).updateOne({ _id: id }, { $set: { status } }, { upsert: true });
  return readApprovals();
}

// Called by generators — resets that type to all-pending
export async function markPending(type, count) {
  const db = await getDb();
  const coll = db.collection(COLL);
  if (type === 'research') {
    await coll.updateOne({ _id: 'research' }, { $set: { status: 'pending' } }, { upsert: true });
  } else {
    await coll.deleteMany({ _id: { $regex: `^${type}-` } });
    if (count > 0) {
      await coll.insertMany(
        Array.from({ length: count }, (_, i) => ({ _id: `${type}-${i + 1}`, status: 'pending' }))
      );
    }
  }
}

export async function bulkSetApproval(type, status) {
  const db = await getDb();
  const coll = db.collection(COLL);
  if (type === 'research') {
    await coll.updateOne({ _id: 'research' }, { $set: { status } }, { upsert: true });
  } else {
    await coll.updateMany({ _id: { $regex: `^${type}-` } }, { $set: { status } });
  }
  return readApprovals();
}
