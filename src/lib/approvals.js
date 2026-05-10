import { readDb, writeDb } from './storage.js';

const DB = 'approvals';

export function readApprovals() {
  return readDb(DB);
}

export function setApproval(id, status) {
  const store = readDb(DB);
  store[id] = status;
  writeDb(DB, store);
  return readApprovals();
}

export function markPending(type, count) {
  const store = readDb(DB);
  // Remove all keys for this type
  for (const key of Object.keys(store)) {
    if (key === type || key.startsWith(`${type}-`)) delete store[key];
  }
  if (type === 'research') {
    store['research'] = 'pending';
  } else {
    for (let i = 1; i <= count; i++) store[`${type}-${i}`] = 'pending';
  }
  writeDb(DB, store);
}

export function bulkSetApproval(type, status) {
  const store = readDb(DB);
  for (const key of Object.keys(store)) {
    if (key === type || key.startsWith(`${type}-`)) store[key] = status;
  }
  writeDb(DB, store);
  return readApprovals();
}
