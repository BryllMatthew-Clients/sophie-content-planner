import { readDb, writeDb } from './storage.js';

const DB = 'schedule';

const DEFAULTS = {
  enabled: false,
  hour: 9,
  minute: 0,
  timezone: 'America/Chicago',
  lastRun: null,
};

export function readScheduleConfig() {
  const stored = readDb(DB);
  return { ...DEFAULTS, ...stored };
}

export function writeScheduleConfig(config) {
  writeDb(DB, config);
}

export function markLastRun() {
  const config = readScheduleConfig();
  writeDb(DB, { ...config, lastRun: new Date().toISOString() });
}
