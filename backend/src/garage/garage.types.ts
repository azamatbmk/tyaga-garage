export type Status = 'working' | 'ready' | 'reserved' | 'service';

export type StaffRole =
  | 'dispatcher'
  | 'branch_chief'
  | 'department_head'
  | 'deputy'
  | 'mechanic'
  | 'master';

export type Branch = {
  id: string;
  name: string;
};

export type StaffUser = {
  id: string;
  name: string;
  initials: string;
  role: StaffRole;
  branchId: string;
};

export type Driver = {
  id: string;
  fullName: string;
  initials: string;
  licenseCategory: string;
};

export type Vehicle = {
  id: string;
  name: string;
  category: string;
  plate: string;
  driver: string;
  initials: string;
  driverId: string;
  branchId: string;
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
  branchId: string;
  creatorId: string;
  assigned?: string;
};

export type Waybill = {
  id: string;
  vehicleId: string;
  driverId: string;
  driverName: string;
  licenseCategory: string;
  weekStart: string;
  odometerStart: number;
};

export type TimesheetEntry = {
  id: string;
  driverId: string;
  month: string;
  requestId?: number;
  hours: number;
  type: 'overtime' | 'weekend';
  note: string;
};

export type Fueling = {
  id: string;
  vehicleId: string;
  fueledAt: string;
  liters: number;
  source: 'cheque' | 'program';
  amount?: number;
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
  branch: Branch;
  staff: StaffUser[];
  drivers: Driver[];
  fleet: Vehicle[];
  jobs: Job[];
  requests: Request[];
  waybills: Waybill[];
  timesheet: TimesheetEntry[];
  fuelings: Fueling[];
  events: GarageEvent[];
  dispatchers: Dispatcher[];
};
