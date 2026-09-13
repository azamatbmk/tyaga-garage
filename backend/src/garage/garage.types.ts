export type Status = 'working' | 'ready' | 'reserved' | 'service';

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

export type Job = {
  id: number;
  vehicle: string;
  title: string;
  location: string;
  start: number;
  end: number;
  tone: string;
};

export type Request = {
  id: number;
  title: string;
  location: string;
  category: string;
  start: number;
  end: number;
  urgent: boolean;
  assigned?: string;
};

export type GarageEvent = {
  time: string;
  title: string;
  detail: string;
  type: 'arrival' | 'request' | 'ready';
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
  requests: Request[];
  events: GarageEvent[];
  dispatchers: Dispatcher[];
};
