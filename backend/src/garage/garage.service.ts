import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignDriverDto } from './dto/assign-driver.dto.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
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
import {
  defaultGarageDataPath,
  isGaragePersistEnabled,
  loadGarageState,
  saveGarageState,
} from './garage-persist.js';
import {
  isTransportUnitRole,
  type Driver,
  type Fueling,
  type GarageEvent,
  type GarageSnapshot,
  type Job,
  type Request,
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
const DEFAULT_CREATOR_ID = 'u-dept';
const SPECIAL_CARRIAGE =
  'передвижение и работа специальных транспортных средств';

function assertPeriod(validFrom: string, validTo: string) {
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

@Injectable()
export class GarageService {
  private fleet: Vehicle[] = clone(INITIAL_FLEET);
  private jobs: Job[] = clone(INITIAL_JOBS);
  private requests: Request[] = clone(INITIAL_REQUESTS);
  private events: GarageEvent[] = clone(INITIAL_EVENTS);
  private drivers: Driver[] = clone(INITIAL_DRIVERS);
  private waybills: Waybill[] = clone(INITIAL_WAYBILLS);
  private timesheet: TimesheetEntry[] = clone(INITIAL_TIMESHEET);
  private fuelings: Fueling[] = clone(INITIAL_FUELINGS);
  private persistenceEnabled = isGaragePersistEnabled();
  private readonly dataPath = defaultGarageDataPath();

  constructor() {
    this.hydrateFromDisk();
  }

  /** Подмена состояния — только для unit-тестов (без записи на диск) */
  loadSeed(seed: GarageSeedState) {
    this.persistenceEnabled = false;
    if (seed.fleet) this.fleet = clone(seed.fleet);
    if (seed.jobs) this.jobs = clone(seed.jobs);
    if (seed.requests) this.requests = clone(seed.requests);
    if (seed.events) this.events = clone(seed.events);
    if (seed.drivers) this.drivers = clone(seed.drivers);
    if (seed.waybills) this.waybills = clone(seed.waybills);
    if (seed.timesheet) this.timesheet = clone(seed.timesheet);
    if (seed.fuelings) this.fuelings = clone(seed.fuelings);
  }

  getSnapshot(): GarageSnapshot {
    return {
      demo: false,
      date: DEMO_DATE,
      snapshotTime: DEMO_TIME,
      branches: clone(DEMO_BRANCHES),
      branch: clone(DEMO_BRANCH),
      staff: clone(DEMO_STAFF),
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
  }

  createRequest(dto: CreateRequestDto): GarageSnapshot {
    const title = dto.title.trim();
    const location = dto.location.trim();
    if (!title || !location) {
      throw new BadRequestException('Укажите работы и адрес объекта');
    }

    const creatorId = dto.creatorId ?? DEFAULT_CREATOR_ID;
    const creator = DEMO_STAFF.find((user) => user.id === creatorId);
    if (!creator) {
      throw new BadRequestException('Неизвестный заявитель');
    }

    const isTuCreator = isTransportUnitRole(creator.role);
    let branchId = creator.branchId;
    if (isTuCreator) {
      if (!dto.branchId || !DEMO_BRANCHES.some((item) => item.id === dto.branchId)) {
        throw new BadRequestException('Укажите филиал для заявки');
      }
      branchId = dto.branchId;
    } else if (!DEMO_BRANCHES.some((item) => item.id === creator.branchId)) {
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
    if (end <= start || start < 8 || end > 20) {
      throw new BadRequestException(
        'Укажите интервал внутри смены 08:00–20:00. Окончание должно быть позже начала.',
      );
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
    this.addEvent(
      `Новая заявка № ${id}`,
      preferredPlate
        ? `${location} · ${dto.category} · ${preferredPlate}`
        : `${location} · ${dto.category}`,
      'request',
    );
    return this.commit();
  }

  assignRequest(requestId: number, vehicleId: string): GarageSnapshot {
    const request = this.requests.find((item) => item.id === requestId);
    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }
    if (request.assigned) {
      throw new BadRequestException('Эта заявка уже распределена');
    }

    const vehicle = this.fleet.find((item) => item.id === vehicleId);
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
    this.addEvent(
      `Заявка № ${request.id} распределена`,
      `${vehicle.name} · ${vehicle.driver}`,
    );
    return this.commit();
  }

  assignDriver(vehicleId: string, dto: AssignDriverDto): GarageSnapshot {
    const vehicle = this.fleet.find((item) => item.id === vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Техника не найдена');
    }

    const driver = this.drivers.find((item) => item.id === dto.driverId);
    if (!driver) {
      throw new BadRequestException('Водитель не найден');
    }

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
    this.addEvent(
      `${vehicle.name}: сменён водитель`,
      `${driver.fullName} · кат. ${driver.licenseCategory}`,
    );
    return this.commit();
  }

  finishService(vehicleId: string): GarageSnapshot {
    const vehicle = this.fleet.find((item) => item.id === vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Техника не найдена');
    }
    if (vehicle.status !== 'service') {
      throw new BadRequestException('Эта техника не находится на обслуживании');
    }

    this.fleet = this.fleet.map((item) =>
      item.id === vehicle.id ? { ...item, status: 'ready' } : item,
    );
    this.addEvent(
      `${vehicle.name} возвращена в парк`,
      'Обслуживание завершено · техника готова к выезду',
    );
    return this.commit();
  }

  createVehicle(dto: CreateVehicleDto): GarageSnapshot {
    const name = dto.name.trim();
    const plate = dto.plate.trim().replace(/\s+/g, ' ').toUpperCase();
    const capacity = dto.capacity?.trim() || '—';

    if (!DEMO_BRANCHES.some((item) => item.id === dto.branchId)) {
      throw new BadRequestException('Неизвестный филиал');
    }
    if (this.fleet.some((item) => item.plate.toUpperCase() === plate)) {
      throw new BadRequestException('Техника с таким госномером уже есть в парке');
    }

    const driver = this.resolveDriverForNewVehicle(dto.driverId, dto.driverName);
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
    };

    this.fleet = [vehicle, ...this.fleet];
    this.addEvent(
      `В парк добавлена ${vehicle.name}`,
      `${vehicle.plate} · ${vehicle.category} · ${vehicle.driver}`,
      'ready',
    );
    return this.commit();
  }

  createWaybill(dto: CreateWaybillDto): GarageSnapshot {
    assertPeriod(dto.validFrom, dto.validTo);
    assertOdometer(dto.odometerStart, dto.odometerEnd);

    const vehicle = this.fleet.find((item) => item.id === dto.vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Техника не найдена');
    }

    const driver = this.drivers.find((item) => item.id === vehicle.driverId);
    if (!driver) {
      throw new BadRequestException('У машины не закреплён водитель');
    }

    const branch =
      DEMO_BRANCHES.find((item) => item.id === vehicle.branchId) ?? DEMO_BRANCH;
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
    this.addEvent(
      `Выдан путевой ${vehicle.name}`,
      `${dto.validFrom}–${dto.validTo} · километраж ${dto.odometerStart} км`,
    );
    return this.commit();
  }

  updateWaybill(waybillId: string, dto: UpdateWaybillDto): GarageSnapshot {
    const current = this.waybills.find((item) => item.id === waybillId);
    if (!current) {
      throw new NotFoundException('Путевой лист не найден');
    }

    const validFrom = dto.validFrom ?? current.validFrom;
    const validTo = dto.validTo ?? current.validTo;
    assertPeriod(validFrom, validTo);

    const odometerStart = dto.odometerStart ?? current.odometerStart;
    const odometerEnd =
      dto.odometerEnd === null
        ? undefined
        : (dto.odometerEnd ?? current.odometerEnd);
    assertOdometer(odometerStart, odometerEnd);

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
    this.addEvent(
      `Обновлён путевой ${current.vehicleBrandModel}`,
      `${validFrom}–${validTo} · километраж ${odometerStart} км`,
    );
    return this.commit();
  }

  async exportExcel() {
    const snapshot = this.getSnapshot();
    return {
      filename: garageExcelFilename(snapshot),
      buffer: await buildGarageExcel(snapshot),
    };
  }

  private hydrateFromDisk() {
    if (!this.persistenceEnabled) return;
    const saved = loadGarageState(this.dataPath);
    if (!saved) return;
    // Старый пустой garage.json — оставляем сид целиком (парк + демо-заявки)
    if (saved.fleet.length === 0 && INITIAL_FLEET.length > 0) {
      return;
    }
    this.fleet = clone(saved.fleet);
    this.jobs = clone(saved.jobs);
    this.requests = clone(saved.requests);
    this.events = clone(saved.events);
    this.drivers = clone(saved.drivers);
    this.waybills = clone(saved.waybills);
    this.timesheet = clone(saved.timesheet);
    this.fuelings = clone(saved.fuelings);
  }

  private commit(): GarageSnapshot {
    if (this.persistenceEnabled) {
      saveGarageState(this.dataPath, {
        fleet: this.fleet,
        jobs: this.jobs,
        requests: this.requests,
        events: this.events,
        drivers: this.drivers,
        waybills: this.waybills,
        timesheet: this.timesheet,
        fuelings: this.fuelings,
      });
    }
    return this.getSnapshot();
  }

  private resolveDriverForNewVehicle(driverId?: string, driverName?: string) {
    if (driverId) {
      const existing = this.drivers.find((item) => item.id === driverId);
      if (!existing) {
        throw new BadRequestException('Водитель не найден');
      }
      return existing;
    }

    const fullName = driverName?.trim() || 'Не назначен';
    if (!driverName?.trim()) {
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
        snils: '000-000-000 00',
      };
      this.drivers = [...this.drivers, created];
      return created;
    }

    const created: Driver = {
      id: `d-${Date.now().toString(36)}`,
      fullName,
      initials: initialsFromName(fullName),
      licenseCategory: 'C',
      licenseSeries: '—',
      licenseNumber: '—',
      licenseIssuedAt: '2000-01-01',
      snils: '000-000-000 00',
    };
    this.drivers = [...this.drivers, created];
    return created;
  }

  private addEvent(
    title: string,
    detail: string,
    type: GarageEvent['type'] = 'ready',
  ) {
    this.events = [{ time: DEMO_TIME, title, detail, type }, ...this.events];
  }
}
