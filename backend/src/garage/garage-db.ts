import { demoPasswordHash } from './password.js';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  DEMO_BRANCHES,
  DEMO_STAFF,
  INITIAL_DRIVERS,
  INITIAL_EVENTS,
  INITIAL_FLEET,
  INITIAL_FUELINGS,
  INITIAL_JOBS,
  INITIAL_REQUESTS,
  INITIAL_TIMESHEET,
  INITIAL_WAYBILLS,
} from './seed.js';
import { defaultGarageDataPath, loadGarageState } from './garage-persist.js';
import type {
  Branch,
  Driver,
  Fueling,
  GarageEvent,
  Job,
  Request,
  StaffUser,
  TimesheetEntry,
  Vehicle,
  Waybill,
} from './garage.types.js';

export type GarageDbState = {
  branches: Branch[];
  staff: StaffUser[];
  drivers: Driver[];
  fleet: Vehicle[];
  jobs: Job[];
  requests: Request[];
  events: GarageEvent[];
  waybills: Waybill[];
  timesheet: TimesheetEntry[];
  fuelings: Fueling[];
};

/** Локальный файл разработки. На сервере ту же схему применяет PostgreSQL. */
export function defaultSqlitePath() {
  return (
    process.env.GARAGE_SQLITE_PATH?.trim() ||
    join(process.cwd(), 'data', 'tyaga.sqlite')
  );
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  ogrn TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  license_category TEXT NOT NULL,
  license_series TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_issued_at TEXT NOT NULL,
  license_expires_at TEXT NOT NULL,
  medical_exam_expires_at TEXT NOT NULL,
  snils TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  plate TEXT NOT NULL,
  driver TEXT NOT NULL,
  initials TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  status TEXT NOT NULL,
  fuel REAL NOT NULL,
  hours REAL NOT NULL,
  capacity TEXT NOT NULL,
  inspection_expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  start_hour REAL NOT NULL,
  end_hour REAL NOT NULL,
  urgent INTEGER NOT NULL,
  branch_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  preferred_vehicle_id TEXT,
  preferred_plate TEXT,
  assigned_vehicle_id TEXT
);

CREATE TABLE IF NOT EXISTS waybills (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  vehicle_id TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  issuer_name TEXT NOT NULL,
  issuer_address TEXT NOT NULL,
  issuer_phone TEXT NOT NULL,
  issuer_ogrn TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_brand_model TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  tech_control_at TEXT NOT NULL,
  tech_control_result TEXT NOT NULL,
  tech_controller_name TEXT NOT NULL,
  departure_at TEXT NOT NULL,
  return_at TEXT,
  odometer_start INTEGER NOT NULL,
  odometer_end INTEGER,
  driver_name TEXT NOT NULL,
  license_series TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_issued_at TEXT NOT NULL,
  license_category TEXT NOT NULL,
  snils TEXT NOT NULL,
  medical_exam_at TEXT NOT NULL,
  medical_exam_result TEXT NOT NULL,
  medic_name TEXT NOT NULL,
  carriage_kind TEXT NOT NULL,
  message_kind TEXT NOT NULL,
  request_id INTEGER,
  request_title TEXT,
  number INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  vehicle_id TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  start_hour REAL NOT NULL,
  end_hour REAL NOT NULL,
  tone TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  sort_order INTEGER PRIMARY KEY,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  type TEXT NOT NULL,
  branch_id TEXT
);

CREATE TABLE IF NOT EXISTS timesheet (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  driver_id TEXT NOT NULL,
  month TEXT NOT NULL,
  request_id INTEGER,
  hours REAL NOT NULL,
  type TEXT NOT NULL,
  note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fuelings (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL,
  vehicle_id TEXT NOT NULL,
  fueled_at TEXT NOT NULL,
  liters REAL NOT NULL,
  source TEXT NOT NULL,
  amount REAL
);

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  staff_id TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

type SqlValue = string | number | null;

export class GarageDatabase {
  private readonly db: DatabaseSync;

  constructor(path: string, options?: { importJson?: boolean }) {
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true });
    }
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec(SCHEMA);
    this.ensurePasswordColumn();
    this.ensureDocumentColumns();
    this.ensureWaybillColumns();
    if (!this.isSeeded()) {
      this.save(initialState(options?.importJson === true));
      this.db
        .prepare(`INSERT INTO schema_meta (key, value) VALUES ('seeded', '1')`)
        .run();
    }
    this.fillMissingPasswords();
    this.fillMissingDocuments();
    this.fillWaybillNumbers();
  }

  close() {
    this.db.close();
  }

  passwordHash(staffId: string) {
    const row = this.db
      .prepare(`SELECT password_hash FROM staff WHERE id = ?`)
      .get(staffId) as { password_hash?: string | null } | undefined;
    return row?.password_hash || null;
  }

  createSession(id: string, staffId: string, expiresAt: string) {
    this.db
      .prepare(`INSERT INTO sessions (id, staff_id, expires_at) VALUES (?, ?, ?)`)
      .run(id, staffId, expiresAt);
  }

  readSession(id: string) {
    const row = this.db
      .prepare(`SELECT staff_id, expires_at FROM sessions WHERE id = ?`)
      .get(id) as { staff_id?: string; expires_at?: string } | undefined;
    if (!row?.staff_id || !row.expires_at) return null;
    return { staffId: row.staff_id, expiresAt: row.expires_at };
  }

  deleteSession(id: string) {
    this.db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
  }

  insertAudit(staffId: string, action: string, detail: string, createdAt: string) {
    this.db
      .prepare(
        `INSERT INTO audit_log (staff_id, action, detail, created_at) VALUES (?, ?, ?, ?)`,
      )
      .run(staffId, action, detail, createdAt);
  }

  private ensurePasswordColumn() {
    const columns = this.db.prepare(`PRAGMA table_info(staff)`).all() as { name?: string }[];
    if (columns.some((column) => column.name === 'password_hash')) return;
    this.db.exec(`ALTER TABLE staff ADD COLUMN password_hash TEXT`);
  }

  private fillMissingPasswords() {
    this.db
      .prepare(
        `UPDATE staff SET password_hash = ? WHERE password_hash IS NULL OR password_hash = ''`,
      )
      .run(demoPasswordHash());
  }

  private ensureDocumentColumns() {
    this.addColumnIfMissing('drivers', 'license_expires_at');
    this.addColumnIfMissing('drivers', 'medical_exam_expires_at');
    this.addColumnIfMissing('vehicles', 'inspection_expires_at');
    this.addColumnIfMissing('events', 'branch_id');
  }

  private ensureWaybillColumns() {
    this.addColumnIfMissing('waybills', 'request_id', 'INTEGER');
    this.addColumnIfMissing('waybills', 'request_title', 'TEXT');
    this.addColumnIfMissing('waybills', 'number', 'INTEGER');
  }

  private fillWaybillNumbers() {
    const missing = this.db
      .prepare(`SELECT id, branch_id FROM waybills WHERE number IS NULL ORDER BY sort_order`)
      .all() as { id?: string; branch_id?: string }[];
    if (!missing.length) return;
    const maxRows = this.db
      .prepare(
        `SELECT branch_id, MAX(number) AS n FROM waybills WHERE number IS NOT NULL GROUP BY branch_id`,
      )
      .all() as { branch_id?: string; n?: number }[];
    const next = new Map(maxRows.map((row) => [row.branch_id ?? '', row.n ?? 0]));
    const update = this.db.prepare(`UPDATE waybills SET number = ? WHERE id = ?`);
    for (const row of missing) {
      const branchId = row.branch_id ?? '';
      const value = (next.get(branchId) ?? 0) + 1;
      next.set(branchId, value);
      update.run(value, row.id ?? '');
    }
  }

  private addColumnIfMissing(
    table: 'drivers' | 'vehicles' | 'events' | 'waybills',
    column: string,
    type = 'TEXT',
  ) {
    const columns = this.db.prepare(`PRAGMA table_info(${table})`).all() as { name?: string }[];
    if (columns.some((item) => item.name === column)) return;
    this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }

  private fillMissingDocuments() {
    const license = this.db.prepare(
      `UPDATE drivers SET license_expires_at = ? WHERE id = ? AND (license_expires_at IS NULL OR license_expires_at = '')`,
    );
    const medical = this.db.prepare(
      `UPDATE drivers SET medical_exam_expires_at = ? WHERE id = ? AND (medical_exam_expires_at IS NULL OR medical_exam_expires_at = '')`,
    );
    for (const driver of INITIAL_DRIVERS) {
      license.run(driver.licenseExpiresAt, driver.id);
      medical.run(driver.medicalExamExpiresAt, driver.id);
    }
    this.db
      .prepare(
        `UPDATE drivers SET license_expires_at = '2028-01-01' WHERE license_expires_at IS NULL OR license_expires_at = ''`,
      )
      .run();
    this.db
      .prepare(
        `UPDATE drivers SET medical_exam_expires_at = '2028-01-01' WHERE medical_exam_expires_at IS NULL OR medical_exam_expires_at = ''`,
      )
      .run();

    const inspection = this.db.prepare(
      `UPDATE vehicles SET inspection_expires_at = ? WHERE id = ? AND (inspection_expires_at IS NULL OR inspection_expires_at = '')`,
    );
    for (const vehicle of INITIAL_FLEET) {
      inspection.run(vehicle.inspectionExpiresAt, vehicle.id);
    }
    this.db
      .prepare(
        `UPDATE vehicles SET inspection_expires_at = '2028-01-01' WHERE inspection_expires_at IS NULL OR inspection_expires_at = ''`,
      )
      .run();
  }

  load(): GarageDbState {
    return {
      branches: this.rows('branches').map(branchFromRow),
      staff: this.rows('staff').map(staffFromRow),
      drivers: this.rows('drivers').map(driverFromRow),
      fleet: this.rows('vehicles').map(vehicleFromRow),
      requests: this.rows('requests').map(requestFromRow),
      waybills: this.rows('waybills').map(waybillFromRow),
      jobs: this.rows('jobs').map(jobFromRow),
      events: this.rows('events').map(eventFromRow),
      timesheet: this.rows('timesheet').map(timesheetFromRow),
      fuelings: this.rows('fuelings').map(fuelingFromRow),
    };
  }

  save(state: GarageDbState) {
    const hashes = this.passwordHashes();
    const fallback = demoPasswordHash();
    this.db.exec('BEGIN');
    try {
      replace(this.db, 'fuelings', FUELING_COLUMNS, state.fuelings.map(fuelingToRow));
      replace(this.db, 'timesheet', TIMESHEET_COLUMNS, state.timesheet.map(timesheetToRow));
      replace(this.db, 'jobs', JOB_COLUMNS, state.jobs.map(jobToRow));
      replace(this.db, 'events', EVENT_COLUMNS, state.events.map(eventToRow));
      replace(this.db, 'waybills', WAYBILL_COLUMNS, state.waybills.map(waybillToRow));
      replace(this.db, 'requests', REQUEST_COLUMNS, state.requests.map(requestToRow));
      replace(this.db, 'vehicles', VEHICLE_COLUMNS, state.fleet.map(vehicleToRow));
      replace(this.db, 'drivers', DRIVER_COLUMNS, state.drivers.map(driverToRow));
      replace(
        this.db,
        'staff',
        STAFF_COLUMNS,
        state.staff.map((item, sortOrder) =>
          staffToRow(item, sortOrder, hashes.get(item.id) ?? fallback),
        ),
      );
      replace(this.db, 'branches', BRANCH_COLUMNS, state.branches.map(branchToRow));
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private passwordHashes() {
    const rows = this.db
      .prepare(`SELECT id, password_hash FROM staff`)
      .all() as { id?: string; password_hash?: string | null }[];
    const hashes = new Map<string, string>();
    for (const row of rows) {
      if (row.id && row.password_hash) hashes.set(row.id, row.password_hash);
    }
    return hashes;
  }

  private isSeeded() {
    const row = this.db
      .prepare(`SELECT value FROM schema_meta WHERE key = 'seeded'`)
      .get() as { value?: string } | undefined;
    return row?.value === '1';
  }

  private rows(table: string) {
    return this.db
      .prepare(`SELECT * FROM ${table} ORDER BY sort_order`)
      .all() as Record<string, SqlValue>[];
  }
}

function initialState(importJson: boolean): GarageDbState {
  const saved = importJson ? loadGarageState(defaultGarageDataPath()) : null;
  const useSaved = Boolean(
    saved && !(saved.fleet.length === 0 && INITIAL_FLEET.length > 0),
  );
  return {
    branches: DEMO_BRANCHES,
    staff: DEMO_STAFF,
    drivers: useSaved && saved ? saved.drivers : INITIAL_DRIVERS,
    fleet: useSaved && saved ? saved.fleet : INITIAL_FLEET,
    jobs: useSaved && saved ? saved.jobs : INITIAL_JOBS,
    requests: useSaved && saved ? saved.requests : INITIAL_REQUESTS,
    events: useSaved && saved ? saved.events : INITIAL_EVENTS,
    waybills: useSaved && saved ? saved.waybills : INITIAL_WAYBILLS,
    timesheet: useSaved && saved ? saved.timesheet : INITIAL_TIMESHEET,
    fuelings: useSaved && saved ? saved.fuelings : INITIAL_FUELINGS,
  };
}

function replace(
  db: DatabaseSync,
  table: string,
  columns: readonly string[],
  rows: SqlValue[][],
) {
  db.prepare(`DELETE FROM ${table}`).run();
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
  const stmt = db.prepare(sql);
  for (const row of rows) stmt.run(...row);
}

function text(row: Record<string, SqlValue>, key: string) {
  const value = row[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function num(row: Record<string, SqlValue>, key: string) {
  const value = row[key];
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function optionalText(row: Record<string, SqlValue>, key: string) {
  const value = row[key];
  if (value == null || value === '') return undefined;
  return String(value);
}

function optionalNum(row: Record<string, SqlValue>, key: string) {
  const value = row[key];
  if (value == null || value === '') return undefined;
  return typeof value === 'number' ? value : Number(value);
}

const BRANCH_COLUMNS = [
  'id',
  'sort_order',
  'name',
  'legal_name',
  'address',
  'phone',
  'ogrn',
] as const;

function branchToRow(item: Branch, sortOrder: number): SqlValue[] {
  return [item.id, sortOrder, item.name, item.legalName, item.address, item.phone, item.ogrn];
}

function branchFromRow(row: Record<string, SqlValue>): Branch {
  return {
    id: text(row, 'id'),
    name: text(row, 'name'),
    legalName: text(row, 'legal_name'),
    address: text(row, 'address'),
    phone: text(row, 'phone'),
    ogrn: text(row, 'ogrn'),
  };
}

const STAFF_COLUMNS = [
  'id',
  'sort_order',
  'name',
  'initials',
  'role',
  'branch_id',
  'password_hash',
] as const;

function staffToRow(item: StaffUser, sortOrder: number, passwordHash: string): SqlValue[] {
  return [item.id, sortOrder, item.name, item.initials, item.role, item.branchId, passwordHash];
}

function staffFromRow(row: Record<string, SqlValue>): StaffUser {
  return {
    id: text(row, 'id'),
    name: text(row, 'name'),
    initials: text(row, 'initials'),
    role: text(row, 'role') as StaffUser['role'],
    branchId: text(row, 'branch_id'),
  };
}

const DRIVER_COLUMNS = [
  'id',
  'sort_order',
  'full_name',
  'initials',
  'license_category',
  'license_series',
  'license_number',
  'license_issued_at',
  'license_expires_at',
  'medical_exam_expires_at',
  'snils',
] as const;

function driverToRow(item: Driver, sortOrder: number): SqlValue[] {
  return [
    item.id,
    sortOrder,
    item.fullName,
    item.initials,
    item.licenseCategory,
    item.licenseSeries,
    item.licenseNumber,
    item.licenseIssuedAt,
    item.licenseExpiresAt,
    item.medicalExamExpiresAt,
    item.snils,
  ];
}

function driverFromRow(row: Record<string, SqlValue>): Driver {
  return {
    id: text(row, 'id'),
    fullName: text(row, 'full_name'),
    initials: text(row, 'initials'),
    licenseCategory: text(row, 'license_category'),
    licenseSeries: text(row, 'license_series'),
    licenseNumber: text(row, 'license_number'),
    licenseIssuedAt: text(row, 'license_issued_at'),
    licenseExpiresAt: text(row, 'license_expires_at'),
    medicalExamExpiresAt: text(row, 'medical_exam_expires_at'),
    snils: text(row, 'snils'),
  };
}

const VEHICLE_COLUMNS = [
  'id',
  'sort_order',
  'name',
  'category',
  'plate',
  'driver',
  'initials',
  'driver_id',
  'branch_id',
  'status',
  'fuel',
  'hours',
  'capacity',
  'inspection_expires_at',
] as const;

function vehicleToRow(item: Vehicle, sortOrder: number): SqlValue[] {
  return [
    item.id,
    sortOrder,
    item.name,
    item.category,
    item.plate,
    item.driver,
    item.initials,
    item.driverId,
    item.branchId,
    item.status,
    item.fuel,
    item.hours,
    item.capacity,
    item.inspectionExpiresAt,
  ];
}

function vehicleFromRow(row: Record<string, SqlValue>): Vehicle {
  return {
    id: text(row, 'id'),
    name: text(row, 'name'),
    category: text(row, 'category'),
    plate: text(row, 'plate'),
    driver: text(row, 'driver'),
    initials: text(row, 'initials'),
    driverId: text(row, 'driver_id'),
    branchId: text(row, 'branch_id'),
    status: text(row, 'status') as Vehicle['status'],
    fuel: num(row, 'fuel'),
    hours: num(row, 'hours'),
    capacity: text(row, 'capacity'),
    inspectionExpiresAt: text(row, 'inspection_expires_at'),
  };
}

const REQUEST_COLUMNS = [
  'id',
  'sort_order',
  'title',
  'location',
  'category',
  'start_hour',
  'end_hour',
  'urgent',
  'branch_id',
  'creator_id',
  'preferred_vehicle_id',
  'preferred_plate',
  'assigned_vehicle_id',
] as const;

function requestToRow(item: Request, sortOrder: number): SqlValue[] {
  return [
    item.id,
    sortOrder,
    item.title,
    item.location,
    item.category,
    item.start,
    item.end,
    item.urgent ? 1 : 0,
    item.branchId,
    item.creatorId,
    item.preferredVehicleId ?? null,
    item.preferredPlate ?? null,
    item.assigned ?? null,
  ];
}

function requestFromRow(row: Record<string, SqlValue>): Request {
  return {
    id: num(row, 'id'),
    title: text(row, 'title'),
    location: text(row, 'location'),
    category: text(row, 'category'),
    start: num(row, 'start_hour'),
    end: num(row, 'end_hour'),
    urgent: num(row, 'urgent') === 1,
    branchId: text(row, 'branch_id'),
    creatorId: text(row, 'creator_id'),
    preferredVehicleId: optionalText(row, 'preferred_vehicle_id'),
    preferredPlate: optionalText(row, 'preferred_plate'),
    assigned: optionalText(row, 'assigned_vehicle_id'),
  };
}

const WAYBILL_COLUMNS = [
  'id',
  'sort_order',
  'vehicle_id',
  'driver_id',
  'branch_id',
  'valid_from',
  'valid_to',
  'issuer_name',
  'issuer_address',
  'issuer_phone',
  'issuer_ogrn',
  'vehicle_type',
  'vehicle_brand_model',
  'vehicle_plate',
  'tech_control_at',
  'tech_control_result',
  'tech_controller_name',
  'departure_at',
  'return_at',
  'odometer_start',
  'odometer_end',
  'driver_name',
  'license_series',
  'license_number',
  'license_issued_at',
  'license_category',
  'snils',
  'medical_exam_at',
  'medical_exam_result',
  'medic_name',
  'carriage_kind',
  'message_kind',
  'request_id',
  'request_title',
  'number',
] as const;

function waybillToRow(item: Waybill, sortOrder: number): SqlValue[] {
  return [
    item.id,
    sortOrder,
    item.vehicleId,
    item.driverId,
    item.branchId,
    item.validFrom,
    item.validTo,
    item.issuerName,
    item.issuerAddress,
    item.issuerPhone,
    item.issuerOgrn,
    item.vehicleType,
    item.vehicleBrandModel,
    item.vehiclePlate,
    item.techControlAt,
    item.techControlResult,
    item.techControllerName,
    item.departureAt,
    item.returnAt ?? null,
    item.odometerStart,
    item.odometerEnd ?? null,
    item.driverName,
    item.licenseSeries,
    item.licenseNumber,
    item.licenseIssuedAt,
    item.licenseCategory,
    item.snils,
    item.medicalExamAt,
    item.medicalExamResult,
    item.medicName,
    item.carriageKind,
    item.messageKind,
    item.requestId ?? null,
    item.requestTitle ?? null,
    item.number,
  ];
}

function waybillFromRow(row: Record<string, SqlValue>): Waybill {
  return {
    id: text(row, 'id'),
    vehicleId: text(row, 'vehicle_id'),
    driverId: text(row, 'driver_id'),
    branchId: text(row, 'branch_id'),
    validFrom: text(row, 'valid_from'),
    validTo: text(row, 'valid_to'),
    issuerName: text(row, 'issuer_name'),
    issuerAddress: text(row, 'issuer_address'),
    issuerPhone: text(row, 'issuer_phone'),
    issuerOgrn: text(row, 'issuer_ogrn'),
    vehicleType: text(row, 'vehicle_type'),
    vehicleBrandModel: text(row, 'vehicle_brand_model'),
    vehiclePlate: text(row, 'vehicle_plate'),
    techControlAt: text(row, 'tech_control_at'),
    techControlResult: text(row, 'tech_control_result'),
    techControllerName: text(row, 'tech_controller_name'),
    departureAt: text(row, 'departure_at'),
    returnAt: optionalText(row, 'return_at'),
    odometerStart: num(row, 'odometer_start'),
    odometerEnd: optionalNum(row, 'odometer_end'),
    driverName: text(row, 'driver_name'),
    licenseSeries: text(row, 'license_series'),
    licenseNumber: text(row, 'license_number'),
    licenseIssuedAt: text(row, 'license_issued_at'),
    licenseCategory: text(row, 'license_category'),
    snils: text(row, 'snils'),
    medicalExamAt: text(row, 'medical_exam_at'),
    medicalExamResult: text(row, 'medical_exam_result'),
    medicName: text(row, 'medic_name'),
    carriageKind: text(row, 'carriage_kind'),
    messageKind: text(row, 'message_kind') as Waybill['messageKind'],
    requestId: optionalNum(row, 'request_id'),
    requestTitle: optionalText(row, 'request_title'),
    number: num(row, 'number'),
  };
}

const JOB_COLUMNS = [
  'id',
  'sort_order',
  'vehicle_id',
  'title',
  'location',
  'start_hour',
  'end_hour',
  'tone',
] as const;

function jobToRow(item: Job, sortOrder: number): SqlValue[] {
  return [
    item.id,
    sortOrder,
    item.vehicle,
    item.title,
    item.location,
    item.start,
    item.end,
    item.tone,
  ];
}

function jobFromRow(row: Record<string, SqlValue>): Job {
  return {
    id: num(row, 'id'),
    vehicle: text(row, 'vehicle_id'),
    title: text(row, 'title'),
    location: text(row, 'location'),
    start: num(row, 'start_hour'),
    end: num(row, 'end_hour'),
    tone: text(row, 'tone'),
  };
}

const EVENT_COLUMNS = ['sort_order', 'time', 'title', 'detail', 'type', 'branch_id'] as const;

function eventToRow(item: GarageEvent, sortOrder: number): SqlValue[] {
  return [sortOrder, item.time, item.title, item.detail, item.type, item.branchId ?? null];
}

function eventFromRow(row: Record<string, SqlValue>): GarageEvent {
  return {
    time: text(row, 'time'),
    title: text(row, 'title'),
    detail: text(row, 'detail'),
    type: text(row, 'type') as GarageEvent['type'],
    branchId: optionalText(row, 'branch_id'),
  };
}

const TIMESHEET_COLUMNS = [
  'id',
  'sort_order',
  'driver_id',
  'month',
  'request_id',
  'hours',
  'type',
  'note',
] as const;

function timesheetToRow(item: TimesheetEntry, sortOrder: number): SqlValue[] {
  return [
    item.id,
    sortOrder,
    item.driverId,
    item.month,
    item.requestId ?? null,
    item.hours,
    item.type,
    item.note,
  ];
}

function timesheetFromRow(row: Record<string, SqlValue>): TimesheetEntry {
  return {
    id: text(row, 'id'),
    driverId: text(row, 'driver_id'),
    month: text(row, 'month'),
    requestId: optionalNum(row, 'request_id'),
    hours: num(row, 'hours'),
    type: text(row, 'type') as TimesheetEntry['type'],
    note: text(row, 'note'),
  };
}

const FUELING_COLUMNS = [
  'id',
  'sort_order',
  'vehicle_id',
  'fueled_at',
  'liters',
  'source',
  'amount',
] as const;

function fuelingToRow(item: Fueling, sortOrder: number): SqlValue[] {
  return [
    item.id,
    sortOrder,
    item.vehicleId,
    item.fueledAt,
    item.liters,
    item.source,
    item.amount ?? null,
  ];
}

function fuelingFromRow(row: Record<string, SqlValue>): Fueling {
  return {
    id: text(row, 'id'),
    vehicleId: text(row, 'vehicle_id'),
    fueledAt: text(row, 'fueled_at'),
    liters: num(row, 'liters'),
    source: text(row, 'source') as Fueling['source'],
    amount: optionalNum(row, 'amount'),
  };
}
