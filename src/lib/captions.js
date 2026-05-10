import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CAPTIONS_PATH = path.join(ROOT, 'output', 'captions.json');

export function readCaptions() {
  if (!fs.existsSync(CAPTIONS_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(CAPTIONS_PATH, 'utf8')); }
  catch { return {}; }
}

function writeCaptions(data) {
  fs.mkdirSync(path.dirname(CAPTIONS_PATH), { recursive: true });
  fs.writeFileSync(CAPTIONS_PATH, JSON.stringify(data, null, 2));
}

export function setCaption(id, caption) {
  const data = readCaptions();
  data[id] = caption;
  writeCaptions(data);
  return data;
}

export function deleteCaption(id) {
  const data = readCaptions();
  delete data[id];
  writeCaptions(data);
  return data;
}
