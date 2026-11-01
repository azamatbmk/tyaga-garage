import type { Driver, Vehicle } from './garage.types.js';

export function isIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function formatIsoDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

/** Документ должен действовать в последний день путевого включительно. */
export function waybillDocumentProblem(
  driver: Driver,
  vehicle: Vehicle,
  validTo: string,
  action: 'выдать' | 'сохранить' = 'выдать',
) {
  const problems: string[] = [];
  if (!isIsoDate(driver.licenseExpiresAt) || driver.licenseExpiresAt < validTo) {
    problems.push(
      `права ${driver.fullName} действуют до ${formatIsoDate(driver.licenseExpiresAt)}`,
    );
  }
  if (!isIsoDate(driver.medicalExamExpiresAt) || driver.medicalExamExpiresAt < validTo) {
    problems.push(
      `медосмотр ${driver.fullName} действует до ${formatIsoDate(driver.medicalExamExpiresAt)}`,
    );
  }
  if (!isIsoDate(vehicle.inspectionExpiresAt) || vehicle.inspectionExpiresAt < validTo) {
    problems.push(
      `техосмотр ${vehicle.name} действует до ${formatIsoDate(vehicle.inspectionExpiresAt)}`,
    );
  }
  if (problems.length === 0) return null;
  return `Нельзя ${action} путевой: ${problems.join('; ')}.`;
}
