import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_PATH = path.join(ROOT, 'output', 'pipeline-schedule.json');

const DEFAULTS = {
  enabled: false,
  hour: 9,
  minute: 0,
  timezone: 'America/Chicago',
  lastRun: null,
};

export function readScheduleConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return { ...DEFAULTS };
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) }; }
  catch { return { ...DEFAULTS }; }
}

export function writeScheduleConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function markLastRun() {
  const config = readScheduleConfig();
  config.lastRun = new Date().toISOString();
  writeScheduleConfig(config);
}
