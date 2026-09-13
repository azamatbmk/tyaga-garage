import { BadRequestException } from '@nestjs/common';
import { GarageService } from './garage.service.js';

describe('GarageService', () => {
  let service: GarageService;

  beforeEach(() => {
    service = new GarageService();
  });

  it('assigns a ready vehicle of the matching category', () => {
    const snapshot = service.assignRequest(1049, '11');
    const request = snapshot.requests.find((item) => item.id === 1049);
    const vehicle = snapshot.fleet.find((item) => item.id === '11');

    expect(request?.assigned).toBe('11');
    expect(vehicle?.status).toBe('reserved');
    expect(snapshot.jobs.some((job) => job.id === 1049 && job.vehicle === '11')).toBe(true);
  });

  it('rejects an already assigned request', () => {
    service.assignRequest(1049, '11');
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
});
