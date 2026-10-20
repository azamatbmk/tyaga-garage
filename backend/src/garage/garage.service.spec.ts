import { BadRequestException } from '@nestjs/common';
import { GarageService } from './garage.service.js';
import {
  TEST_DRIVERS,
  TEST_FLEET,
  TEST_REQUESTS,
  TEST_WAYBILLS,
} from './test-fixtures.js';

function serviceWithFixtures() {
  const service = new GarageService();
  service.loadSeed({
    fleet: TEST_FLEET,
    drivers: TEST_DRIVERS,
    requests: TEST_REQUESTS,
    waybills: TEST_WAYBILLS,
  });
  return service;
}

describe('GarageService', () => {
  let service: GarageService;

  beforeEach(() => {
    service = serviceWithFixtures();
  });

  it('starts with one vehicle per branch from seed', () => {
    const empty = new GarageService().getSnapshot();
    expect(empty.fleet).toHaveLength(9);
    expect(empty.drivers).toHaveLength(9);
    expect(new Set(empty.fleet.map((item) => item.branchId)).size).toBe(9);
    expect(empty.waybills).toEqual([]);
    expect(empty.demo).toBe(false);
    expect(empty.branches).toHaveLength(9);
    expect(empty.branches[0]?.name).toBe('Владикавказский');
    expect(empty.branches.some((item) => item.id === 'gup')).toBe(false);
    expect(empty.staff.filter((item) => item.branchId === 'gup')).toHaveLength(3);
  });

  it('assigns a ready vehicle of the matching category', () => {
    const snapshot = service.assignRequest(1049, '05');
    const request = snapshot.requests.find((item) => item.id === 1049);
    const vehicle = snapshot.fleet.find((item) => item.id === '05');

    expect(request?.assigned).toBe('05');
    expect(vehicle?.status).toBe('reserved');
    expect(snapshot.jobs.some((job) => job.id === 1049 && job.vehicle === '05')).toBe(true);
  });

  it('rejects an already assigned request', () => {
    service.assignRequest(1049, '05');
    expect(() => service.assignRequest(1049, '05')).toThrow(BadRequestException);
  });

  it('rejects assigning a vehicle from another branch', () => {
    expect(() => service.assignRequest(1049, '11')).toThrow(BadRequestException);
  });

  it('creates a request inside the shift window', () => {
    const snapshot = service.createRequest({
      title: 'Проба котлована',
      location: 'ЖК Тест',
      category: 'Экскаватор-погрузчик',
      start: '13:00',
      end: '17:00',
      urgent: false,
    });

    expect(snapshot.requests[0]).toMatchObject({
      id: 1051,
      title: 'Проба котлована',
      category: 'Экскаватор-погрузчик',
    });
  });

  it('rejects an invalid clock time', () => {
    expect(() =>
      service.createRequest({
        title: 'Ночная смена',
        location: 'База',
        category: 'Экскаватор-погрузчик',
        start: '08:99',
        end: '17:00',
        urgent: false,
      }),
    ).toThrow(BadRequestException);
  });

  it('returns a vehicle from service to the ready pool', () => {
    const snapshot = service.finishService('06');
    expect(snapshot.fleet.find((item) => item.id === '06')?.status).toBe('ready');
  });

  it('reassigns a driver on a vehicle', () => {
    const snapshot = service.assignDriver('01', { driverId: 'd02' });
    const vehicle = snapshot.fleet.find((item) => item.id === '01');
    expect(vehicle?.driverId).toBe('d02');
    expect(vehicle?.driver).toBe('Другой Водитель');
  });

  it('attaches creator and branch when creating a request', () => {
    const snapshot = service.createRequest({
      title: 'От механика',
      location: 'База',
      category: 'Экскаватор-погрузчик',
      start: '13:00',
      end: '17:00',
      urgent: false,
      creatorId: 'u-mechanic',
    });
    expect(snapshot.requests[0]).toMatchObject({
      creatorId: 'u-mechanic',
      branchId: 'b-vlad',
    });
  });

  it('lets GUP dispatcher create a request for a chosen branch', () => {
    const snapshot = service.createRequest({
      title: 'От ГУП',
      location: 'Беслан',
      category: 'Бульдозер',
      start: '13:00',
      end: '17:00',
      urgent: false,
      creatorId: 'u-senior-dispatcher',
      branchId: 'b-prav',
    });
    expect(snapshot.requests[0]).toMatchObject({
      creatorId: 'u-senior-dispatcher',
      branchId: 'b-prav',
      category: 'Бульдозер',
    });
  });

  it('rejects GUP create without branchId', () => {
    expect(() =>
      service.createRequest({
        title: 'Без филиала',
        location: 'База',
        category: 'Экскаватор-погрузчик',
        start: '13:00',
        end: '17:00',
        urgent: false,
        creatorId: 'u-senior-dispatcher',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects preferred vehicle that is not ready', () => {
    expect(() =>
      service.createRequest({
        title: 'Занятая машина',
        location: 'Объект',
        category: 'Бульдозер',
        start: '13:00',
        end: '17:00',
        urgent: false,
        creatorId: 'u-senior-dispatcher',
        branchId: 'b-prav',
        preferredVehicleId: '06',
      }),
    ).toThrow(BadRequestException);
  });

  it('creates a waybill for any period with manual odometer', () => {
    const snapshot = service.createWaybill({
      vehicleId: '05',
      validFrom: '2026-09-15',
      validTo: '2026-09-20',
      odometerStart: 50100,
      messageKind: 'пригородное',
    });
    expect(snapshot.waybills[0]).toMatchObject({
      vehicleId: '05',
      validFrom: '2026-09-15',
      validTo: '2026-09-20',
      odometerStart: 50100,
      messageKind: 'пригородное',
    });
  });

  it('updates waybill period and odometer', () => {
    const snapshot = service.updateWaybill('w-01', {
      validFrom: '2026-09-01',
      validTo: '2026-09-30',
      odometerStart: 124600,
      odometerEnd: 125000,
    });
    const waybill = snapshot.waybills.find((item) => item.id === 'w-01');
    expect(waybill).toMatchObject({
      validFrom: '2026-09-01',
      validTo: '2026-09-30',
      odometerStart: 124600,
      odometerEnd: 125000,
    });
  });

  it('rejects inverted waybill period', () => {
    expect(() =>
      service.createWaybill({
        vehicleId: '05',
        validFrom: '2026-09-20',
        validTo: '2026-09-15',
        odometerStart: 100,
      }),
    ).toThrow(BadRequestException);
  });

  it('creates a vehicle in a branch park', () => {
    const empty = new GarageService();
    const snapshot = empty.createVehicle({
      name: 'JCB 3CX',
      category: 'Экскаватор-погрузчик',
      plate: 'А 123 АА · 15',
      branchId: 'b-vlad',
      capacity: 'Ковш 1 м³',
    });
    expect(snapshot.fleet[0]).toMatchObject({
      name: 'JCB 3CX',
      category: 'Экскаватор-погрузчик',
      branchId: 'b-vlad',
      status: 'ready',
      driver: 'Не назначен',
    });
    expect(snapshot.drivers.some((item) => item.id === 'd-unassigned')).toBe(true);
  });

  it('rejects duplicate plate', () => {
    const empty = new GarageService();
    empty.createVehicle({
      name: 'A',
      category: 'Самосвал',
      plate: 'М 001 ММ 15',
      branchId: 'b-vlad',
    });
    expect(() =>
      empty.createVehicle({
        name: 'B',
        category: 'Самосвал',
        plate: 'м 001 мм 15',
        branchId: 'b-prav',
      }),
    ).toThrow(BadRequestException);
  });
});
