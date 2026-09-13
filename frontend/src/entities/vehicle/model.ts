export type Status = "working" | "ready" | "reserved" | "service";

export type Vehicle = {
  id: string;
  name: string;
  category: string;
  plate: string;
  driver: string;
  initials: string;
  status: Status;
  fuel: number;
  hours: number;
  capacity: string;
};

export const STATUS: Record<Status, { label: string; short: string }> = {
  working: { label: "На объекте", short: "Работает" },
  ready: { label: "Готова к выезду", short: "Свободна" },
  reserved: { label: "В резерве", short: "Резерв" },
  service: { label: "На обслуживании", short: "Сервис" },
};

export function vehicleCategories(fleet: Vehicle[]) {
  return [...new Set(fleet.map((vehicle) => vehicle.category))];
}

export function countByStatus(fleet: Vehicle[]) {
  return {
    working: fleet.filter((item) => item.status === "working").length,
    ready: fleet.filter((item) => item.status === "ready").length,
    reserved: fleet.filter((item) => item.status === "reserved").length,
    service: fleet.filter((item) => item.status === "service").length,
  };
}
