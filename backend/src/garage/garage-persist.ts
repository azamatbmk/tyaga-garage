import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  Driver,
  Fueling,
  GarageEvent,
  Job,
  Request,
  TimesheetEntry,
  Vehicle,
  Waybill,
} from './garage.types.js';

export type PersistedGarageState = {
  fleet: Vehicle[];
  jobs: Job[];
  requests: Request[];
  events: GarageEvent[];
  drivers: Driver[];
  waybills: Waybill[];
  timesheet: TimesheetEntry[];
  fuelings: Fueling[];
};

/** Файл локального хранилища (рядом с cwd при `npm run start:dev` из backend/) */
export function defaultGarageDataPath() {
  return (
    process.env.GARAGE_DATA_PATH?.trim() ||
    join(process.cwd(), 'data', 'garage.json')
  );
}

export function isGaragePersistEnabled() {
  if (process.env.GARAGE_PERSIST === '0') return false;
  if (process.env.VITEST === 'true') return false;
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasId(value: unknown): value is { id: string } {
  return isRecord(value) && typeof value.id === 'string' && value.id.length > 0;
}

export function loadGarageState(path: string): PersistedGarageState | null {
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    if (!isRecord(raw)) return null;
    if (!Array.isArray(raw.fleet) || !Array.isArray(raw.drivers)) return null;
    if (!raw.fleet.every(hasId) || !raw.drivers.every(hasId)) return null;
    // Парк без водителей — битый снимок
    if (raw.fleet.length > 0 && raw.drivers.length === 0) return null;

    return {
      fleet: raw.fleet as Vehicle[],
      jobs: Array.isArray(raw.jobs) ? (raw.jobs as Job[]) : [],
      requests: Array.isArray(raw.requests) ? (raw.requests as Request[]) : [],
      events: Array.isArray(raw.events) ? (raw.events as GarageEvent[]) : [],
      drivers: raw.drivers as Driver[],
      waybills: Array.isArray(raw.waybills) ? (raw.waybills as Waybill[]) : [],
      timesheet: Array.isArray(raw.timesheet)
        ? (raw.timesheet as TimesheetEntry[])
        : [],
      fuelings: Array.isArray(raw.fuelings) ? (raw.fuelings as Fueling[]) : [],
    };
  } catch {
    return null;
  }
}

export function saveGarageState(path: string, state: PersistedGarageState) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(tmp, path);
}
