import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AssignDriverDto } from './dto/assign-driver.dto.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { isIsoDate, waybillDocumentProblem } from './documents.js';
import { CreateWaybillDto } from './dto/create-waybill.dto.js';
import { UpdateWaybillDto } from './dto/update-waybill.dto.js';
import {
  DEMO_BRANCH,
  DEMO_BRANCHES,
  DEMO_STAFF,
  DISPATCHERS,
  INITIAL_DRIVERS,
  INITIAL_EVENTS,
  INITIAL_FLEET,
  INITIAL_FUELINGS,
  INITIAL_JOBS,
  INITIAL_REQUESTS,
  INITIAL_TIMESHEET,
  INITIAL_WAYBILLS,
  REQUEST_CATEGORIES,
} from './seed.js';
import { buildGarageExcel, garageExcelFilename } from './garage-excel.js';
import { actorFromStaff, branchScope, type Actor } from './actor.js';
import { GarageDatabase, defaultSqlitePath } from './garage-db.js';
import { isGaragePersistEnabled } from './garage-persist.js';
import { demoPasswordHash, verifyPassword } from './password.js';
import { SESSION_MAX_AGE_SEC } from './session-cookie.js';
import {
  isTransportUnitRole,
  type Branch,
  type Driver,
  type Fueling,
  type GarageEvent,
  type GarageSnapshot,
  type Job,
  type Request,
  type StaffUser,
  type TimesheetEntry,
  type Vehicle,
  type Waybill,
} from './garage.types.js';

export type GarageSeedState = {
  fleet?: Vehicle[];
  jobs?: Job[];
  requests?: Request[];
  events?: GarageEvent[];
  drivers?: Driver[];
  waybills?: Waybill[];
  timesheet?: TimesheetEntry[];
  fuelings?: Fueling[];
};

const DEMO_DATE = '2026-09-12';
const DEMO_TIME = '10:45';
const SPECIAL_CARRIAGE =
  'передвижение и работа специальных транспортных средств';

function assertPeriod(validFrom: string, validTo: string) {
  if (!isIsoDate(validFrom) || !isIsoDate(validTo)) {
    throw new BadRequestException('Некорректная дата путевого');
  }
  if (validTo < validFrom) {
    throw new BadRequestException(
      'Дата окончания срока не может быть раньше даты начала',
    );
  }
}

function assertOdometer(start: number, end?: number | null) {
  if (end != null && end < start) {
    throw new BadRequestException(
      'Километраж при возврате не может быть меньше показания при выпуске',
    );
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function toHours(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new BadRequestException('Некорректное время');
  }
  return hours + minutes / 60;
}

function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return fullName.trim().slice(0, 2).toUpperCase() || 'НА';
}

function nextVehicleId(fleet: Vehicle[]): string {
  const nums = fleet
    .map((item) => Number.parseInt(item.id, 10))
    .filter((value) => Number.isFinite(value));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return String(next).padStart(2, '0');
}

/** Путь к sqlite для одного теста. В обычном запуске не задаётся. */
let sqlitePathOverride: string | null = null;

export function useSqlitePathForTests(path: string | null) {
  sqlitePathOverride = path;
}

@Injectable()
export class GarageService {
  private branches: Branch[] = clone(DEMO_BRANCHES);
  private staff: StaffUser[] = clone(DEMO_STAFF);
  private fleet: Vehicle[] = clone(INITIAL_FLEET);
  private jobs: Job[] = clone(INITIAL_JOBS);
  private requests: Request[] = clone(INITIAL_REQUESTS);
  private events: GarageEvent[] = clone(INITIAL_EVENTS);
  private drivers: Driver[] = clone(INITIAL_DRIVERS);
  private waybills: Waybill[] = clone(INITIAL_WAYBILLS);
  private timesheet: TimesheetEntry[] = clone(INITIAL_TIMESHEET);
  private fuelings: Fueling[] = clone(INITIAL_FUELINGS);
  private db: GarageDatabase | null = null;
  private pendingAudit: { staffId: string; action: string; detail: string } | null = null;
  private readonly memorySessions = new Map<string, { staffId: string; expiresAt: number }>();

  constructor() {
    const sqlitePath =
      sqlitePathOverride ?? (isGaragePersistEnabled() ? defaultSqlitePath() : null);
    if (!sqlitePath) return;
    this.db = new GarageDatabase(sqlitePath, { importJson: !sqlitePathOverride });
    this.applyState(this.db.load());
  }

  /** Подмена состояния — только для unit-тестов (без записи в базу) */
  loadSeed(seed: GarageSeedState) {
    this.db?.close();
    this.db = null;
    if (seed.fleet) this.fleet = clone(seed.fleet);
    if (seed.jobs) this.jobs = clone(seed.jobs);
    if (seed.requests) this.requests = clone(seed.requests);
    if (seed.events) this.events = clone(seed.events);
    if (seed.drivers) this.drivers = clone(seed.drivers);
    if (seed.waybills) this.waybills = clone(seed.waybills);
    if (seed.timesheet) this.timesheet = clone(seed.timesheet);
    if (seed.fuelings) this.fuelings = clone(seed.fuelings);
  }

  close() {
    this.db?.close();
    this.db = null;
  }

  listLoginStaff() {
    return this.staff.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
    }));
  }

  openSession(staffId: string, password: string) {
    const user = this.staff.find((item) => item.id === staffId);
    const hash = user ? this.db?.passwordHash(user.id) : null;
    const ok = hash
      ? verifyPassword(password, hash)
      : verifyPassword(password, demoPasswordHash());
    if (!user || !ok) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const id = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000).toISOString();
    if (this.db) {
      this.db.createSession(id, user.id, expiresAt);
    } else {
      this.memorySessions.set(id, { staffId: user.id, expiresAt: Date.parse(expiresAt) });
    }
    return id;
  }

  closeSession(sessionId: string) {
    if (this.db) this.db.deleteSession(sessionId);
    this.memorySessions.delete(sessionId);
  }

  actorBySession(sessionId: string): Actor | null {
    const session = this.db
      ? this.db.readSession(sessionId)
      : this.memorySession(sessionId);
    if (!session) return null;
    if (Date.parse(session.expiresAt) <= Date.now()) {
      this.closeSession(sessionId);
      return null;
    }
    const user = this.staff.find((item) => item.id === session.staffId);
    return user ? actorFromStaff(user) : null;
  }

  private memorySession(sessionId: string) {
    const row = this.memorySessions.get(sessionId);
    if (!row) return null;
    return { staffId: row.staffId, expiresAt: new Date(row.expiresAt).toISOString() };
  }

  getSnapshot(actor?: Actor): GarageSnapshot {
    const snapshot: GarageSnapshot = {
      demo: false,
      date: DEMO_DATE,
      snapshotTime: DEMO_TIME,
      branches: clone(this.branches),
      branch: clone(this.branches[0] ?? DEMO_BRANCH),
      staff: clone(this.staff),
      drivers: clone(this.drivers),
      fleet: clone(this.fleet),
      jobs: clone(this.jobs),
      requests: clone(this.requests),
      waybills: clone(this.waybills),
      timesheet: clone(this.timesheet),
      fuelings: clone(this.fuelings),
      events: clone(this.events),
      dispatchers: clone(DISPATCHERS),
    };
    const scope = actor ? branchScope(actor) : null;
    return scope ? scopeSnapshot(snapshot, scope) : snapshot;
  }

  createRequest(dto: CreateRequestDto, actor: Actor): GarageSnapshot {
    const title = dto.title.trim();
    const location = dto.location.trim();
    if (!title || !location) {
      throw new BadRequestException('Укажите работы и адрес объекта');
    }

    const creator = this.staff.find((user) => user.id === actor.id);
    if (!creator) {
      throw new BadRequestException('Неизвестный заявитель');
    }

    const isTuCreator = isTransportUnitRole(creator.role);
    let branchId = creator.branchId;
    if (isTuCreator) {
      if (!dto.branchId || !this.branches.some((item) => item.id === dto.branchId)) {
        throw new BadRequestException('Укажите филиал для заявки');
      }
      branchId = dto.branchId;
    } else if (!this.branches.some((item) => item.id === creator.branchId)) {
      throw new BadRequestException('Заявку может создать только сотрудник филиала');
    }

    if (!(REQUEST_CATEGORIES as readonly string[]).includes(dto.category)) {
      throw new BadRequestException('Неизвестный тип техники');
    }

    let preferredVehicleId: string | undefined;
    let preferredPlate: string | undefined;
    if (dto.preferredVehicleId) {
      const preferred = this.fleet.find((item) => item.id === dto.preferredVehicleId);
      if (
        !preferred ||
        preferred.branchId !== branchId ||
        preferred.category !== dto.category ||
        preferred.status !== 'ready'
      ) {
        throw new BadRequestException(
          'Выберите свободную машину нужного типа в филиале заявки',
        );
      }
      preferredVehicleId = preferred.id;
      preferredPlate = preferred.plate;
    }

    const start = toHours(dto.start);
    const end = toHours(dto.end);
    if (end <= start) {
      throw new BadRequestException('Окончание должно быть позже начала.');
    }

    const id = Math.max(...this.requests.map((request) => request.id), 1050) + 1;
    this.requests = [
      {
        id,
        title,
        location,
        category: dto.category,
        start,
        end,
        urgent: dto.urgent,
        branchId,
        creatorId: creator.id,
        preferredVehicleId,
        preferredPlate,
      },
      ...this.requests,
    ];
    this.record(
      actor,
      `Новая заявка № ${id}`,
      preferredPlate
        ? `${location} · ${dto.category} · ${preferredPlate}`
        : `${location} · ${dto.category}`,
      'request',
      branchId,
    );
    return this.commit(actor);
  }

  assignRequest(requestId: number, vehicleId: string, actor: Actor): GarageSnapshot {
    const request = this.requests.find((item) => item.id === requestId);
    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }
    if (request.assigned) {
      throw new BadRequestException('Эта заявка уже распределена');
    }

    const vehicle = this.fleet.find((item) => item.id === vehicleId);
    this.assertScope(actor, request.branchId);
    if (
      !vehicle ||
      vehicle.status !== 'ready' ||
      vehicle.category !== request.category ||
      vehicle.branchId !== request.branchId
    ) {
      throw new BadRequestException(
        'Выберите свободную технику подходящего типа в том же филиале',
      );
    }

    this.fleet = this.fleet.map((item) =>
      item.id === vehicle.id ? { ...item, status: 'reserved' } : item,
    );
    this.jobs = [
      ...this.jobs,
      {
        id: request.id,
        vehicle: vehicle.id,
        title: request.title,
        location: request.location,
        start: request.start,
        end: request.end,
        tone: 'reserved',
      },
    ];
    this.requests = this.requests.map((item) =>
      item.id === request.id ? { ...item, assigned: vehicle.id } : item,
    );
    this.record(
      actor,
      `Заявка № ${request.id} распределена`,
      `${vehicle.name} · ${vehicle.driver}`,
      'ready',
      request.branchId,
    );
    return this.commit(actor);
  }

  assignDriver(vehicleId: string, dto: AssignDriverDto, actor: Actor): GarageSnapshot {
    const vehicle = this.fleet.find((item) => item.id === vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Техника не найдена');
    }
    this.assertScope(actor, vehicle.branchId);

    const driver = this.drivers.find((item) => item.id === dto.driverId);
    if (!driver) {
      throw new BadRequestException('Водитель не найден');
    }
    this.assertDriverInBranch(driver.id, vehicle.branchId, actor);

    this.fleet = this.fleet.map((item) =>
      item.id === vehicleId
        ? {
            ...item,
            driverId: driver.id,
            driver: driver.fullName,
            initials: driver.initials,
          }
        : item,
    );
    this.record(
      actor,
      `${vehicle.name}: сменён водитель`,
      `${driver.fullName} · кат. ${driver.licenseCategory}`,
      'ready',
      vehicle.branchId,
    );
    return this.commit(actor);
  }

  finishService(vehicleId: string, actor: Actor): GarageSnapshot {
    const vehicle = this.fleet.find((item) => item.id === vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Техника не найдена');
    }
    this.assertScope(actor, vehicle.branchId);
    if (vehicle.status !== 'service') {
      throw new BadRequestException('Эта техника не находится на обслуживании');
    }

    this.fleet = this.fleet.map((item) =>
      item.id === vehicle.id ? { ...item, status: 'ready' } : item,
    );
    this.record(
      actor,
      `${vehicle.name} возвращена в парк`,
      'Обслуживание завершено · техника готова к выезду',
      'ready',
      vehicle.branchId,
    );
    return this.commit(actor);
  }

  createVehicle(dto: CreateVehicleDto, actor: Actor): GarageSnapshot {
    const name = dto.name.trim();
    const plate = dto.plate.trim().replace(/\s+/g, ' ').toUpperCase();
    const capacity = dto.capacity?.trim() || '—';

    if (!this.branches.some((item) => item.id === dto.branchId)) {
      throw new BadRequestException('Неизвестный филиал');
    }
    this.assertScope(actor, dto.branchId);
    if (this.fleet.some((item) => item.plate.toUpperCase() === plate)) {
      throw new BadRequestException('Техника с таким госномером уже есть в парке');
    }

    if (!isIsoDate(dto.inspectionExpiresAt)) {
      throw new BadRequestException('Некорректная дата техосмотра');
    }
    if (
      (dto.licenseExpiresAt && !isIsoDate(dto.licenseExpiresAt)) ||
      (dto.medicalExamExpiresAt && !isIsoDate(dto.medicalExamExpiresAt))
    ) {
      throw new BadRequestException('Некорректная дата прав или медосмотра');
    }
    const driver = this.resolveDriverForNewVehicle(dto);
    this.assertDriverInBranch(driver.id, dto.branchId, actor);
    const vehicle: Vehicle = {
      id: nextVehicleId(this.fleet),
      name,
      category: dto.category,
      plate,
      driver: driver.fullName,
      initials: driver.initials,
      driverId: driver.id,
      branchId: dto.branchId,
      status: 'ready',
      fuel: dto.fuel ?? 100,
      hours: dto.hours ?? 0,
      capacity,
      inspectionExpiresAt: dto.inspectionExpiresAt,
    };

    this.fleet = [vehicle, ...this.fleet];
    this.record(
      actor,
      `В парк добавлена ${vehicle.name}`,
      `${vehicle.plate} · ${vehicle.category} · ${vehicle.driver}`,
      'ready',
      dto.branchId,
    );
    return this.commit(actor);
  }

  createWaybill(dto: CreateWaybillDto, actor: Actor): GarageSnapshot {
    assertPeriod(dto.validFrom, dto.validTo);
    assertOdometer(dto.odometerStart, dto.odometerEnd);

    const vehicle = this.fleet.find((item) => item.id === dto.vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Техника не найдена');
    }

    this.assertScope(actor, vehicle.branchId);
    const driver = this.drivers.find((item) => item.id === vehicle.driverId);
    if (!driver) {
      throw new BadRequestException('У машины не закреплён водитель');
    }
    const blocked = waybillDocumentProblem(driver, vehicle, dto.validTo);
    if (blocked) {
      throw new BadRequestException(blocked);
    }

    const branch =
      this.branches.find((item) => item.id === vehicle.branchId) ??
      this.branches[0] ??
      DEMO_BRANCH;
    const id = `w-${Date.now().toString(36)}`;
    const departureAt = `${dto.validFrom}T08:00:00`;
    const waybill: Waybill = {
      id,
      vehicleId: vehicle.id,
      driverId: driver.id,
      branchId: vehicle.branchId,
      validFrom: dto.validFrom,
      validTo: dto.validTo,
      issuerName: branch.legalName,
      issuerAddress: branch.address,
      issuerPhone: branch.phone,
      issuerOgrn: branch.ogrn,
      vehicleType: vehicle.category,
      vehicleBrandModel: vehicle.name,
      vehiclePlate: vehicle.plate,
      techControlAt: `${dto.validFrom}T07:40:00`,
      techControlResult: 'Исправен, выпуск разрешён',
      techControllerName: 'В. Громов',
      departureAt,
      returnAt: undefined,
      odometerStart: dto.odometerStart,
      odometerEnd: dto.odometerEnd ?? undefined,
      driverName: driver.fullName,
      licenseSeries: driver.licenseSeries,
      licenseNumber: driver.licenseNumber,
      licenseIssuedAt: driver.licenseIssuedAt,
      licenseCategory: driver.licenseCategory,
      snils: driver.snils,
      medicalExamAt: `${dto.validFrom}T07:25:00`,
      medicalExamResult: 'Допущен к управлению ТС',
      medicName: 'С. Иванова',
      carriageKind: SPECIAL_CARRIAGE,
      messageKind: dto.messageKind ?? 'городское',
    };

    this.waybills = [waybill, ...this.waybills];
    this.record(
      actor,
      `Выдан путевой ${vehicle.name}`,
      `${dto.validFrom}–${dto.validTo} · километраж ${dto.odometerStart} км`,
      'ready',
      vehicle.branchId,
    );
    return this.commit(actor);
  }

  updateWaybill(waybillId: string, dto: UpdateWaybillDto, actor: Actor): GarageSnapshot {
    const current = this.waybills.find((item) => item.id === waybillId);
    if (!current) {
      throw new NotFoundException('Путевой лист не найден');
    }
    this.assertScope(actor, current.branchId);

    const validFrom = dto.validFrom ?? current.validFrom;
    const validTo = dto.validTo ?? current.validTo;
    assertPeriod(validFrom, validTo);

    const odometerStart = dto.odometerStart ?? current.odometerStart;
    const odometerEnd =
      dto.odometerEnd === null
        ? undefined
        : (dto.odometerEnd ?? current.odometerEnd);
    assertOdometer(odometerStart, odometerEnd);

    const vehicle = this.fleet.find((item) => item.id === current.vehicleId);
    const driver = this.drivers.find((item) => item.id === current.driverId);
    if (!vehicle || !driver) {
      throw new BadRequestException('У путевого нет машины или водителя');
    }
    const blocked = waybillDocumentProblem(driver, vehicle, validTo, 'сохранить');
    if (blocked) {
      throw new BadRequestException(blocked);
    }

    this.waybills = this.waybills.map((item) =>
      item.id === waybillId
        ? {
            ...item,
            validFrom,
            validTo,
            odometerStart,
            odometerEnd,
            messageKind: dto.messageKind ?? item.messageKind,
            departureAt: dto.validFrom
              ? `${validFrom}T08:00:00`
              : item.departureAt,
          }
        : item,
    );
    this.record(
      actor,
      `Обновлён путевой ${current.vehicleBrandModel}`,
      `${validFrom}–${validTo} · километраж ${odometerStart} км`,
      'ready',
      current.branchId,
    );
    return this.commit(actor);
  }

  async exportExcel(actor?: Actor) {
    const snapshot = this.getSnapshot(actor);
    return {
      filename: garageExcelFilename(snapshot),
      buffer: await buildGarageExcel(snapshot),
    };
  }

  private applyState(state: {
    branches: Branch[];
    staff: StaffUser[];
    fleet: Vehicle[];
    jobs: Job[];
    requests: Request[];
    events: GarageEvent[];
    drivers: Driver[];
    waybills: Waybill[];
    timesheet: TimesheetEntry[];
    fuelings: Fueling[];
  }) {
    this.branches = clone(state.branches);
    this.staff = clone(state.staff);
    this.fleet = clone(state.fleet);
    this.jobs = clone(state.jobs);
    this.requests = clone(state.requests);
    this.events = clone(state.events);
    this.drivers = clone(state.drivers);
    this.waybills = clone(state.waybills);
    this.timesheet = clone(state.timesheet);
    this.fuelings = clone(state.fuelings);
  }

  private commit(actor?: Actor): GarageSnapshot {
    this.db?.save({
      branches: this.branches,
      staff: this.staff,
      fleet: this.fleet,
      jobs: this.jobs,
      requests: this.requests,
      events: this.events,
      drivers: this.drivers,
      waybills: this.waybills,
      timesheet: this.timesheet,
      fuelings: this.fuelings,
    });
    if (this.db && this.pendingAudit) {
      this.db.insertAudit(
        this.pendingAudit.staffId,
        this.pendingAudit.action,
        this.pendingAudit.detail,
        new Date().toISOString(),
      );
    }
    this.pendingAudit = null;
    return this.getSnapshot(actor);
  }

  private record(
    actor: Actor,
    title: string,
    detail: string,
    type: GarageEvent['type'],
    branchId: string,
  ) {
    this.addEvent(title, `${detail} · ${actor.name}`, type, branchId);
    this.pendingAudit = { staffId: actor.id, action: title, detail };
  }

  private assertDriverInBranch(driverId: string, branchId: string, actor: Actor) {
    if (driverId === 'd-unassigned' || isTransportUnitRole(actor.role)) return;
    const homes = new Set(
      this.fleet
        .filter((item) => item.driverId === driverId)
        .map((item) => item.branchId),
    );
    if (homes.size > 0 && !homes.has(branchId)) {
      throw new BadRequestException('Водитель закреплён за другим филиалом');
    }
  }

  private assertScope(actor: Actor, branchId: string) {
    const scope = branchScope(actor);
    if (scope && scope !== branchId) {
      throw new ForbiddenException('Нет доступа к этому филиалу');
    }
  }

  private resolveDriverForNewVehicle(dto: CreateVehicleDto) {
    if (dto.driverId) {
      const existing = this.drivers.find((item) => item.id === dto.driverId);
      if (!existing) {
        throw new BadRequestException('Водитель не найден');
      }
      return existing;
    }

    const fullName = dto.driverName?.trim() || 'Не назначен';
    if (!dto.driverName?.trim()) {
      const unassigned = this.drivers.find((item) => item.id === 'd-unassigned');
      if (unassigned) return unassigned;
      const created: Driver = {
        id: 'd-unassigned',
        fullName: 'Не назначен',
        initials: 'НА',
        licenseCategory: '—',
        licenseSeries: '—',
        licenseNumber: '—',
        licenseIssuedAt: '2000-01-01',
        licenseExpiresAt: '2000-01-01',
        medicalExamExpiresAt: '2000-01-01',
        snils: '000-000-000 00',
      };
      this.drivers = [...this.drivers, created];
      return created;
    }

    if (!dto.licenseExpiresAt || !dto.medicalExamExpiresAt) {
      throw new BadRequestException('Укажите срок прав и медосмотра нового водителя');
    }

    const created: Driver = {
      id: `d-${Date.now().toString(36)}`,
      fullName,
      initials: initialsFromName(fullName),
      licenseCategory: 'C',
      licenseSeries: '—',
      licenseNumber: '—',
      licenseIssuedAt: '2000-01-01',
      licenseExpiresAt: dto.licenseExpiresAt,
      medicalExamExpiresAt: dto.medicalExamExpiresAt,
      snils: '000-000-000 00',
    };
    this.drivers = [...this.drivers, created];
    return created;
  }

  private addEvent(
    title: string,
    detail: string,
    type: GarageEvent['type'],
    branchId: string,
  ) {
    this.events = [{ time: DEMO_TIME, title, detail, type, branchId }, ...this.events];
  }
}

function scopeSnapshot(snapshot: GarageSnapshot, branchId: string): GarageSnapshot {
  const branch = snapshot.branches.find((item) => item.id === branchId) ?? snapshot.branch;
  const fleet = snapshot.fleet.filter((item) => item.branchId === branchId);
  const fleetIds = new Set(fleet.map((item) => item.id));
  const driverIds = new Set(fleet.map((item) => item.driverId));
  return {
    ...snapshot,
    branch,
    fleet,
    drivers: snapshot.drivers.filter((item) => driverIds.has(item.id)),
    requests: snapshot.requests.filter((item) => item.branchId === branchId),
    waybills: snapshot.waybills.filter((item) => item.branchId === branchId),
    jobs: snapshot.jobs.filter((item) => fleetIds.has(item.vehicle)),
    fuelings: snapshot.fuelings.filter((item) => fleetIds.has(item.vehicleId)),
    timesheet: snapshot.timesheet.filter((item) => driverIds.has(item.driverId)),
    staff: snapshot.staff.filter((item) => item.branchId === branchId),
    branches: [branch],
    events: snapshot.events.filter((item) => item.branchId === branchId),
  };
}
