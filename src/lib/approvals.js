import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const APPROVALS_PATH = path.join(ROOT, 'output', 'approvals.json');

export function readApprovals() {
  if (!fs.existsSync(APPROVALS_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(APPROVALS_PATH, 'utf8')); }
  catch { return {}; }
}

function writeApprovals(data) {
  fs.mkdirSync(path.dirname(APPROVALS_PATH), { recursive: true });
  fs.writeFileSync(APPROVALS_PATH, JSON.stringify(data, null, 2));
}

export function setApproval(id, status) {
  const data = readApprovals();
  data[id] = status;
  writeApprovals(data);
  return data;
}

// Called by generators after saving output — resets that type to all-pending
export function markPending(type, count) {
  const data = readApprovals();
  if (type === 'research') {
    data['research'] = 'pending';
  } else {
    for (const key of Object.keys(data)) {
      if (key.startsWith(type + '-')) delete data[key];
    }
    for (let i = 1; i <= count; i++) {
      data[`${type}-${i}`] = 'pending';
    }
  }
  writeApprovals(data);
}

export function bulkSetApproval(type, status) {
  const data = readApprovals();
  if (type === 'research') {
    data['research'] = status;
  } else {
    for (const key of Object.keys(data)) {
      if (key.startsWith(type + '-')) data[key] = status;
    }
  }
  writeApprovals(data);
  return data;
}
