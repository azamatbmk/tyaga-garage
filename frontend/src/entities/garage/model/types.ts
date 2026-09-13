import type { RequestItem } from "@/entities/request";
import type { Vehicle } from "@/entities/vehicle";

export type Job = {
  id: number;
  vehicle: string;
  title: string;
  location: string;
  start: number;
  end: number;
  tone: string;
};

export type GarageEvent = {
  time: string;
  title: string;
  detail: string;
  type: "arrival" | "request" | "ready";
};

export type Dispatcher = {
  name: string;
  initials: string;
  role: string;
  time: string;
  color: string;
};

export type GarageSnapshot = {
  demo: true;
  date: string;
  snapshotTime: string;
  fleet: Vehicle[];
  jobs: Job[];
  requests: RequestItem[];
  events: GarageEvent[];
  dispatchers: Dispatcher[];
};
