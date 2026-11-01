import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { actorFromStaff } from './actor.js';
import { GarageService, useSqlitePathForTests } from './garage.service.js';
import { DEMO_STAFF } from './seed.js';

describe('garage sqlite', () => {
  const dirs: string[] = [];

  afterEach(() => {
    useSqlitePathForTests(null);
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('seeds once and keeps a new request after reopen', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tyaga-sqlite-'));
    dirs.push(dir);
    const path = join(dir, 'tyaga.sqlite');
    useSqlitePathForTests(path);

    const first = new GarageService();
    const dept = actorFromStaff(DEMO_STAFF.find((item) => item.id === 'u-dept')!);
    const created = first.createRequest({
      title: 'Проба котлована',
      location: 'ЖК Тест',
      category: 'Экскаватор-погрузчик',
      start: '13:00',
      end: '17:00',
      urgent: false,
    }, dept);
    expect(created.requests[0]?.title).toBe('Проба котлована');
    expect(created.branches.map((item) => item.id)).toEqual(['b-vlad']);
    first.close();

    const second = new GarageService();
    expect(second.getSnapshot().requests[0]?.title).toBe('Проба котлована');
    expect(second.getSnapshot().fleet).toHaveLength(9);
    expect(second.getSnapshot().branches).toHaveLength(9);
    expect(second.getSnapshot().drivers.find((item) => item.id === 'd-01')?.licenseExpiresAt).toBe(
      '2026-10-02',
    );
    second.close();
  });
});
