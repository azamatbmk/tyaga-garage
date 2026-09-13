import ExcelJS from 'exceljs';
import {
  buildGarageExcel,
  excelText,
  formatClock,
  garageExcelFilename,
  GARAGE_EXCEL_SHEETS,
} from './garage-excel.js';
import { GarageService } from './garage.service.js';

async function loadWorkbook(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  // exceljs types expect Buffer; Node 22 Buffer generics do not match that alias.
  await workbook.xlsx.load(buffer as never);
  return workbook;
}

function sheetValues(sheet: ExcelJS.Worksheet) {
  return sheet.getSheetValues().slice(1) as Array<Array<string | number | undefined>>;
}

describe('garage Excel export', () => {
  it('formats decimal hours as a clock', () => {
    expect(formatClock(8)).toBe('08:00');
    expect(formatClock(8.5)).toBe('08:30');
    expect(formatClock(8.999)).toBe('09:00');
    expect(formatClock(Number.NaN)).toBe('—');
  });

  it('neutralizes Excel formula prefixes in user text', () => {
    expect(excelText('=1+2')).toBe("'=1+2");
    expect(excelText('+cmd')).toBe("'+cmd");
    expect(excelText('Планировка')).toBe('Планировка');
  });

  it('keeps the download name ASCII-safe', () => {
    expect(garageExcelFilename({ date: '../evil' } as never)).toBe('tyaga-smena-smena.xlsx');
  });

  it('builds a workbook with operational sheets and live snapshot data', async () => {
    const service = new GarageService();
    service.assignRequest(1049, '11');
    const snapshot = service.getSnapshot();
    const buffer = await buildGarageExcel(snapshot);
    const workbook = await loadWorkbook(buffer);

    expect(garageExcelFilename(snapshot)).toBe('tyaga-smena-2026-09-12.xlsx');
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      ...GARAGE_EXCEL_SHEETS,
    ]);

    const fleetRows = sheetValues(workbook.getWorksheet('Парк')!);
    expect(fleetRows[0]?.[1]).toBe('Бортовой №');
    expect(fleetRows.some((row) => row[2] === 'JCB 3CX')).toBe(true);

    const requestRows = sheetValues(workbook.getWorksheet('Заявки')!);
    const assigned = requestRows.find((row) => row[1] === 1049);
    expect(assigned?.[8]).toBe('Назначена');
    expect(assigned?.[10]).toBe('11');
  });

  it('writes user-controlled request text as strings, not formulas', async () => {
    const service = new GarageService();
    service.createRequest({
      title: '=1+2',
      location: '+HYPERLINK("http://evil")',
      category: 'Экскаватор-погрузчик',
      start: '13:00',
      end: '17:00',
      urgent: false,
    });

    const workbook = await loadWorkbook(await buildGarageExcel(service.getSnapshot()));
    const sheet = workbook.getWorksheet('Заявки')!;
    const row = sheet.getSheetValues().find((item) => Array.isArray(item) && item[1] === 1051) as
      | Array<string | number | undefined>
      | undefined;

    expect(row?.[2]).toBe("'=1+2");
    expect(sheet.getCell('B2').type).not.toBe(ExcelJS.ValueType.Formula);
  });
});
