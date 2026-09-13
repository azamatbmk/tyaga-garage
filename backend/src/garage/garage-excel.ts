import ExcelJS from 'exceljs';
import type { GarageSnapshot, Status } from './garage.types.js';

const STATUS_LABEL: Record<Status, string> = {
  working: 'На объекте',
  ready: 'Готова к выезду',
  reserved: 'В резерве',
  service: 'На обслуживании',
};

const EVENT_LABEL = {
  arrival: 'Прибытие',
  request: 'Заявка',
  ready: 'Готовность',
} as const;

const TONE_LABEL: Record<string, string> = {
  blue: 'На объекте',
  reserved: 'Резерв',
  lime: 'Обслуживание',
};

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF2F3A2C' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFF5F7F0' },
};

export const GARAGE_EXCEL_SHEETS = [
  'Сводка',
  'Парк',
  'Заявки',
  'План работ',
  'Команда',
  'События',
] as const;

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function garageExcelFilename(snapshot: GarageSnapshot): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(snapshot.date) ? snapshot.date : 'smena';
  return `tyaga-smena-${date}.xlsx`;
}

export function formatClock(hours: number): string {
  if (!Number.isFinite(hours)) {
    return '—';
  }
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = ((totalMinutes % 60) + 60) % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function excelText(value: string): string {
  if (FORMULA_PREFIX.test(value) || value.startsWith("'")) {
    return `'${value}`;
  }
  return value;
}

function cellValue(value: string | number): string | number {
  return typeof value === 'string' ? excelText(value) : value;
}

function vehicleById(snapshot: GarageSnapshot, id: string | undefined) {
  if (!id) return undefined;
  return snapshot.fleet.find((item) => item.id === id);
}

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) {
  const sheet = workbook.addWorksheet(name);
  const header = sheet.addRow(headers);
  header.font = HEADER_FONT;
  header.fill = HEADER_FILL;
  header.alignment = { vertical: 'middle', wrapText: true };
  header.height = 22;

  for (const row of rows) {
    sheet.addRow(row.map(cellValue));
  }

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.columns.forEach((column, index) => {
    const headerLen = headers[index]?.length ?? 10;
    const widest = rows.reduce((max, row) => {
      const value = row[index];
      return Math.max(max, value == null ? 0 : String(value).length);
    }, headerLen);
    column.width = Math.min(Math.max(widest + 3, 12), 48);
  });
}

export async function buildGarageExcel(snapshot: GarageSnapshot): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ТЯГА';
  workbook.created = new Date(`${snapshot.date}T${snapshot.snapshotTime}:00`);

  const fleetCounts = {
    working: snapshot.fleet.filter((item) => item.status === 'working').length,
    ready: snapshot.fleet.filter((item) => item.status === 'ready').length,
    reserved: snapshot.fleet.filter((item) => item.status === 'reserved').length,
    service: snapshot.fleet.filter((item) => item.status === 'service').length,
  };
  const pending = snapshot.requests.filter((item) => !item.assigned).length;

  addSheet(
    workbook,
    'Сводка',
    ['Показатель', 'Значение'],
    [
      ['Гараж', 'Основной гараж'],
      ['Дата смены', snapshot.date],
      ['Время среза', snapshot.snapshotTime],
      ['Окно смены', '08:00–20:00'],
      ['Техники всего', snapshot.fleet.length],
      ['На объекте', fleetCounts.working],
      ['Готовы к выезду', fleetCounts.ready],
      ['В резерве', fleetCounts.reserved],
      ['На обслуживании', fleetCounts.service],
      ['Заявки', snapshot.requests.length],
      ['Ждут назначения', pending],
      ['Наряды', snapshot.jobs.length],
      ['Диспетчеры', snapshot.dispatchers.length],
      ['События смены', snapshot.events.length],
    ],
  );

  addSheet(
    workbook,
    'Парк',
    [
      'Бортовой №',
      'Техника',
      'Тип',
      'Госномер',
      'Статус',
      'Машинист',
      'Топливо, %',
      'Наработка, м/ч',
      'Характеристика',
    ],
    snapshot.fleet.map((vehicle) => [
      vehicle.id,
      vehicle.name,
      vehicle.category,
      vehicle.plate,
      STATUS_LABEL[vehicle.status] ?? vehicle.status,
      vehicle.driver,
      vehicle.fuel,
      vehicle.hours,
      vehicle.capacity,
    ]),
  );

  addSheet(
    workbook,
    'Заявки',
    [
      '№',
      'Работы',
      'Объект',
      'Тип техники',
      'Начало',
      'Окончание',
      'Приоритет',
      'Статус',
      'Назначена',
      'Бортовой №',
    ],
    snapshot.requests.map((request) => {
      const assignedId = request.assigned;
      const assigned = vehicleById(snapshot, assignedId);
      return [
        request.id,
        request.title,
        request.location,
        request.category,
        formatClock(request.start),
        formatClock(request.end),
        request.urgent ? 'Срочная' : 'Обычная',
        assignedId ? 'Назначена' : 'Ждёт назначения',
        assigned?.name ?? assignedId ?? '—',
        assignedId ?? '—',
      ];
    }),
  );

  addSheet(
    workbook,
    'План работ',
    [
      '№ наряда',
      'Бортовой №',
      'Техника',
      'Машинист',
      'Работы',
      'Объект',
      'Начало',
      'Окончание',
      'Тип слота',
    ],
    snapshot.jobs.map((job) => {
      const vehicle = vehicleById(snapshot, job.vehicle);
      return [
        job.id,
        job.vehicle,
        vehicle?.name ?? '—',
        vehicle?.driver ?? '—',
        job.title,
        job.location,
        formatClock(job.start),
        formatClock(job.end),
        TONE_LABEL[job.tone] ?? (job.tone || '—'),
      ];
    }),
  );

  addSheet(
    workbook,
    'Команда',
    ['Тип', 'ФИО', 'Роль / техника', 'Госномер', 'Занятость', 'Смена'],
    [
      ...snapshot.dispatchers.map((dispatcher) => [
        'Диспетчер',
        dispatcher.name,
        dispatcher.role,
        '—',
        'На смене',
        dispatcher.time,
      ]),
      ...snapshot.fleet.map((vehicle) => [
        'Машинист',
        vehicle.driver,
        `${vehicle.name} · ${vehicle.category}`,
        vehicle.plate,
        STATUS_LABEL[vehicle.status] ?? vehicle.status,
        '08:00–20:00',
      ]),
    ],
  );

  addSheet(
    workbook,
    'События',
    ['Время', 'Тип', 'Событие', 'Детали'],
    snapshot.events.map((event) => [
      event.time,
      EVENT_LABEL[event.type] ?? event.type,
      event.title,
      event.detail,
    ]),
  );

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
