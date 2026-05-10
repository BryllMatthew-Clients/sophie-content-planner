import { readDb, writeDb } from './storage.js';

const DB = 'captions';

export function readCaptions() {
  return readDb(DB);
}

export function setCaption(id, caption) {
  const store = readDb(DB);
  store[id] = caption;
  writeDb(DB, store);
  return readCaptions();
}

export function deleteCaption(id) {
  const store = readDb(DB);
  delete store[id];
  writeDb(DB, store);
  return readCaptions();
}
