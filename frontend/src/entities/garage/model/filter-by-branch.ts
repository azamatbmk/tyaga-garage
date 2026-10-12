import type { GarageSnapshot } from "./types";

/** Фильтр снимка под филиал: техника, заявки, путевые и связанные jobs/fuelings. */
export function filterSnapshotByBranch(
  snapshot: GarageSnapshot,
  branchId: string,
): GarageSnapshot {
  const branch =
    snapshot.branches.find((item) => item.id === branchId) ?? snapshot.branch;
  const fleet = snapshot.fleet.filter((item) => item.branchId === branchId);
  const fleetIds = new Set(fleet.map((item) => item.id));
  const driverIds = new Set(fleet.map((item) => item.driverId));
  const requests = snapshot.requests.filter((item) => item.branchId === branchId);
  const waybills = snapshot.waybills.filter((item) => item.branchId === branchId);
  const jobs = snapshot.jobs.filter((item) => fleetIds.has(item.vehicle));
  const fuelings = snapshot.fuelings.filter((item) => fleetIds.has(item.vehicleId));
  const timesheet = snapshot.timesheet.filter((item) => driverIds.has(item.driverId));
  const drivers = snapshot.drivers.filter((item) => driverIds.has(item.id));
  const staff = snapshot.staff.filter((item) => item.branchId === branchId);

  return {
    ...snapshot,
    branch,
    fleet,
    drivers,
    requests,
    waybills,
    jobs,
    fuelings,
    timesheet,
    staff,
  };
}
