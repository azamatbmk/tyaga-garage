import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadGarageState, saveGarageState } from './garage-persist.js';

describe('garage-persist', () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('round-trips fleet and drivers', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tyaga-garage-'));
    dirs.push(dir);
    const path = join(dir, 'garage.json');

    saveGarageState(path, {
      fleet: [
        {
          id: '01',
          name: 'КАМАЗ',
          category: 'Самосвал',
          plate: 'А123АА15',
          driver: 'Иванов И.',
          initials: 'ИИ',
          driverId: 'd-1',
          branchId: 'b-vlad',
          status: 'ready',
          fuel: 80,
          hours: 1200,
          capacity: '10 т',
        },
      ],
      jobs: [],
      requests: [],
      events: [],
      drivers: [
        {
          id: 'd-1',
          fullName: 'Иванов И.',
          initials: 'ИИ',
          licenseCategory: 'C',
          licenseSeries: '99',
          licenseNumber: '123456',
          licenseIssuedAt: '2020-01-01',
          snils: '000-000-000 00',
        },
      ],
      waybills: [],
      timesheet: [],
      fuelings: [],
    });

    const loaded = loadGarageState(path);
    expect(loaded?.fleet).toHaveLength(1);
    expect(loaded?.fleet[0]?.plate).toBe('А123АА15');
    expect(loaded?.drivers[0]?.id).toBe('d-1');
    expect(JSON.parse(readFileSync(path, 'utf8')).fleet[0].name).toBe('КАМАЗ');
  });

  it('returns null for missing file', () => {
    expect(loadGarageState(join(tmpdir(), 'no-such-tyaga-garage.json'))).toBeNull();
  });

  it('rejects fleet without drivers', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tyaga-garage-'));
    dirs.push(dir);
    const path = join(dir, 'garage.json');
    saveGarageState(path, {
      fleet: [
        {
          id: '01',
          name: 'X',
          category: 'Самосвал',
          plate: 'А1',
          driver: 'A',
          initials: 'A',
          driverId: 'd-1',
          branchId: 'b-vlad',
          status: 'ready',
          fuel: 1,
          hours: 1,
          capacity: '1',
        },
      ],
      jobs: [],
      requests: [],
      events: [],
      drivers: [],
      waybills: [],
      timesheet: [],
      fuelings: [],
    });
    expect(loadGarageState(path)).toBeNull();
  });
});
