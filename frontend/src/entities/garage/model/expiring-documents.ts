import type { GarageSnapshot } from "./types";

export const DOCUMENT_HORIZON_DAYS = 30;

export type DocumentAlert = {
  id: string;
  vehicleId: string;
  kind: "license" | "medical" | "inspection";
  title: string;
  who: string;
  detail: string;
  branchName: string;
  expiresAt: string;
  days: number;
};

function dayNumber(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86_400_000;
}

function addIsoDays(iso: string, days: number) {
  const start = dayNumber(iso);
  if (start == null) return iso;
  return new Date((start + days) * 86_400_000).toISOString().slice(0, 10);
}

export function formatDocumentDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function documentStatus(days: number) {
  if (days < 0) return `просрочено на ${-days} дн.`;
  if (days === 0) return "истекает сегодня";
  return `через ${days} дн.`;
}

export function expiringDocuments(
  snapshot: Pick<GarageSnapshot, "date" | "fleet" | "drivers" | "branches">,
  horizonDays = DOCUMENT_HORIZON_DAYS,
): DocumentAlert[] {
  const todayValue = dayNumber(snapshot.date);
  if (todayValue == null) return [];
  const today = todayValue;
  const limit = addIsoDays(snapshot.date, horizonDays);
  const branchName = new Map(snapshot.branches.map((item) => [item.id, item.name]));
  const drivers = new Map(snapshot.drivers.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const alerts: DocumentAlert[] = [];

  function consider(
    key: string,
    alert: Omit<DocumentAlert, "days">,
    expiresAt: string,
  ) {
    if (seen.has(key) || expiresAt > limit) return;
    const expiry = dayNumber(expiresAt);
    if (expiry == null) return;
    seen.add(key);
    alerts.push({ ...alert, days: expiry - today });
  }

  for (const vehicle of snapshot.fleet) {
    const driver = drivers.get(vehicle.driverId);
    const branch = branchName.get(vehicle.branchId) ?? vehicle.branchId;
    if (driver) {
      consider(
        `license:${driver.id}`,
        {
          id: `license:${driver.id}`,
          vehicleId: vehicle.id,
          kind: "license",
          title: "Права",
          who: driver.fullName,
          detail: vehicle.plate,
          branchName: branch,
          expiresAt: driver.licenseExpiresAt,
        },
        driver.licenseExpiresAt,
      );
      consider(
        `medical:${driver.id}`,
        {
          id: `medical:${driver.id}`,
          vehicleId: vehicle.id,
          kind: "medical",
          title: "Медосмотр",
          who: driver.fullName,
          detail: vehicle.plate,
          branchName: branch,
          expiresAt: driver.medicalExamExpiresAt,
        },
        driver.medicalExamExpiresAt,
      );
    }
    consider(
      `inspection:${vehicle.id}`,
      {
        id: `inspection:${vehicle.id}`,
        vehicleId: vehicle.id,
        kind: "inspection",
        title: "Техосмотр",
        who: vehicle.name,
        detail: vehicle.plate,
        branchName: branch,
        expiresAt: vehicle.inspectionExpiresAt,
      },
      vehicle.inspectionExpiresAt,
    );
  }

  return alerts.sort((left, right) => left.days - right.days || left.title.localeCompare(right.title, "ru"));
}
