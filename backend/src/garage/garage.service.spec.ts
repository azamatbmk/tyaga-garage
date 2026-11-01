import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { actorFromStaff, type Actor } from './actor.js';
import { GarageService } from './garage.service.js';
import { DEMO_PASSWORD } from './password.js';
import { DEMO_STAFF } from './seed.js';
import {
  TEST_DRIVERS,
  TEST_FLEET,
  TEST_REQUESTS,
  TEST_WAYBILLS,
} from './test-fixtures.js';

function asActor(id: string): Actor {
  const user = DEMO_STAFF.find((item) => item.id === id);
  if (!user) throw new Error(id);
  return actorFromStaff(user);
}

const TU = asActor('u-senior-dispatcher');

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
    const snapshot = service.assignRequest(1049, '05', TU);
    const request = snapshot.requests.find((item) => item.id === 1049);
    const vehicle = snapshot.fleet.find((item) => item.id === '05');

    expect(request?.assigned).toBe('05');
    expect(vehicle?.status).toBe('reserved');
    expect(snapshot.jobs.some((job) => job.id === 1049 && job.vehicle === '05')).toBe(true);
  });

  it('rejects an already assigned request', () => {
    service.assignRequest(1049, '05', TU);
    expect(() => service.assignRequest(1049, '05', TU)).toThrow(BadRequestException);
  });

  it('rejects assigning a vehicle from another branch', () => {
    expect(() => service.assignRequest(1049, '11', TU)).toThrow(BadRequestException);
  });

  it('creates a request for any time of day', () => {
    const snapshot = service.createRequest({
      title: 'Проба котлована',
      location: 'ЖК Тест',
      category: 'Экскаватор-погрузчик',
      start: '13:00',
      end: '17:00',
      urgent: false,
    }, asActor('u-dept'));

    expect(snapshot.requests[0]).toMatchObject({
      id: 1051,
      title: 'Проба котлована',
      category: 'Экскаватор-погрузчик',
    });
  });

  it('accepts a request in the evening', () => {
    const snapshot = service.createRequest({
      title: 'Вечерние работы',
      location: 'База',
      category: 'Экскаватор-погрузчик',
      start: '21:00',
      end: '23:30',
      urgent: false,
    }, asActor('u-dept'));

    expect(snapshot.requests[0]).toMatchObject({
      title: 'Вечерние работы',
      start: 21,
      end: 23.5,
    });
  });

  it('rejects an invalid clock time', () => {
    expect(() =>
      service.createRequest({
        title: 'Ночные работы',
        location: 'База',
        category: 'Экскаватор-погрузчик',
        start: '08:99',
        end: '17:00',
        urgent: false,
      }, asActor('u-dept')),
    ).toThrow(BadRequestException);
  });

  it('returns a vehicle from service to the ready pool', () => {
    const snapshot = service.finishService('06', TU);
    expect(snapshot.fleet.find((item) => item.id === '06')?.status).toBe('ready');
  });

  it('reassigns a driver on a vehicle', () => {
    const snapshot = service.assignDriver('01', { driverId: 'd02' }, TU);
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
    }, asActor('u-mechanic'));
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
      branchId: 'b-prav',
    }, TU);
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
      }, TU),
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
        branchId: 'b-prav',
        preferredVehicleId: '06',
      }, TU),
    ).toThrow(BadRequestException);
  });

  it('creates a waybill for any period with manual odometer', () => {
    const snapshot = service.createWaybill({
      vehicleId: '05',
      validFrom: '2026-09-15',
      validTo: '2026-09-20',
      odometerStart: 50100,
      messageKind: 'пригородное',
    }, TU);
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
    }, TU);
    const waybill = snapshot.waybills.find((item) => item.id === 'w-01');
    expect(waybill).toMatchObject({
      validFrom: '2026-09-01',
      validTo: '2026-09-30',
      odometerStart: 124600,
      odometerEnd: 125000,
    });
  });

  it('rejects a waybill when a document does not cover the period', () => {
    service.loadSeed({
      fleet: TEST_FLEET.map((item) =>
        item.id === '05' ? { ...item, inspectionExpiresAt: '2026-09-16' } : item,
      ),
      drivers: TEST_DRIVERS.map((item) =>
        item.id === 'd01' ? { ...item, licenseExpiresAt: '2026-09-10' } : item,
      ),
      requests: TEST_REQUESTS,
    });

    expect(() =>
      service.createWaybill({
        vehicleId: '05',
        validFrom: '2026-09-15',
        validTo: '2026-09-20',
        odometerStart: 100,
      }, TU),
    ).toThrow(/права Тест Водитель/);
  });

  it('rejects inverted waybill period', () => {
    expect(() =>
      service.createWaybill({
        vehicleId: '05',
        validFrom: '2026-09-20',
        validTo: '2026-09-15',
        odometerStart: 100,
      }, TU),
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
      inspectionExpiresAt: '2028-01-01',
    }, TU);
    expect(snapshot.fleet[0]).toMatchObject({
      name: 'JCB 3CX',
      category: 'Экскаватор-погрузчик',
      branchId: 'b-vlad',
      status: 'ready',
      driver: 'Не назначен',
    });
    expect(snapshot.drivers.some((item) => item.id === 'd-unassigned')).toBe(true);
  });

  it('hides other branches and rejects a foreign driver or a fake date', () => {
    const prav = asActor('u-dispatcher-prav');
    const snapshot = service.getSnapshot(prav);
    expect(snapshot.branches.map((item) => item.id)).toEqual(['b-prav']);
    expect(snapshot.fleet.every((item) => item.branchId === 'b-prav')).toBe(true);
    expect(() => service.assignDriver('06', { driverId: 'd01' }, prav)).toThrow(
      /другим филиалом/,
    );
    expect(() =>
      service.createVehicle({
        name: 'Новая',
        category: 'Самосвал',
        plate: 'Х 100 ХХ 15',
        branchId: 'b-prav',
        inspectionExpiresAt: '2026-02-31',
      }, prav),
    ).toThrow(/техосмотра/);
  });

  it('rejects a foreign branch and a wrong password', () => {
    expect(() => service.assignRequest(1049, '05', asActor('u-dispatcher-prav'))).toThrow(
      ForbiddenException,
    );
    expect(() => service.openSession('u-mechanic', 'не-тот')).toThrow(UnauthorizedException);
    const sessionId = service.openSession('u-mechanic', DEMO_PASSWORD);
    expect(service.actorBySession(sessionId)?.id).toBe('u-mechanic');
  });

  it('rejects duplicate plate', () => {
    const empty = new GarageService();
    empty.createVehicle({
      name: 'A',
      category: 'Самосвал',
      plate: 'М 001 ММ 15',
      branchId: 'b-vlad',
      inspectionExpiresAt: '2028-01-01',
    }, TU);
    expect(() =>
      empty.createVehicle({
        name: 'B',
        category: 'Самосвал',
      plate: 'м 001 мм 15',
      branchId: 'b-prav',
      inspectionExpiresAt: '2028-01-01',
    }, TU),
    ).toThrow(BadRequestException);
  });
});
