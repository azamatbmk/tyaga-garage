import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto.js';
import {
  DISPATCHERS,
  INITIAL_EVENTS,
  INITIAL_FLEET,
  INITIAL_JOBS,
  INITIAL_REQUESTS,
} from './seed.js';
import { buildGarageExcel, garageExcelFilename } from './garage-excel.js';
import type {
  GarageEvent,
  GarageSnapshot,
  Job,
  Request,
  Vehicle,
} from './garage.types.js';

const DEMO_DATE = '2026-09-12';
const DEMO_TIME = '10:45';

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

@Injectable()
export class GarageService {
  private fleet: Vehicle[] = clone(INITIAL_FLEET);
  private jobs: Job[] = clone(INITIAL_JOBS);
  private requests: Request[] = clone(INITIAL_REQUESTS);
  private events: GarageEvent[] = clone(INITIAL_EVENTS);

  getSnapshot(): GarageSnapshot {
    return {
      demo: true,
      date: DEMO_DATE,
      snapshotTime: DEMO_TIME,
      fleet: clone(this.fleet),
      jobs: clone(this.jobs),
      requests: clone(this.requests),
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

    const categories = [...new Set(this.fleet.map((vehicle) => vehicle.category))];
    if (!categories.includes(dto.category)) {
      throw new BadRequestException('Неизвестный тип техники');
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
      },
      ...this.requests,
    ];
    this.addEvent(`Новая заявка № ${id}`, `${location} · ${dto.category}`, 'request');
    return this.getSnapshot();
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
      vehicle.category !== request.category
    ) {
      throw new BadRequestException(
        'Выберите свободную технику подходящего типа',
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
    return this.getSnapshot();
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
    return this.getSnapshot();
  }

  async exportExcel() {
    const snapshot = this.getSnapshot();
    return {
      filename: garageExcelFilename(snapshot),
      buffer: await buildGarageExcel(snapshot),
    };
  }

  private addEvent(
    title: string,
    detail: string,
    type: GarageEvent['type'] = 'ready',
  ) {
    this.events = [{ time: DEMO_TIME, title, detail, type }, ...this.events];
  }
}
