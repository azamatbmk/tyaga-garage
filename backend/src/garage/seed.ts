import type {
  Branch,
  Dispatcher,
  Driver,
  Fueling,
  GarageEvent,
  Job,
  Request,
  StaffUser,
  TimesheetEntry,
  Vehicle,
  Waybill,
} from './garage.types.js';
import { GUP_SCOPE_ID } from './garage.types.js';

const GUP_LEGAL = 'ГУП «ТЯГА»';
const GUP_OGRN = '1021500532109';

function branch(
  id: string,
  name: string,
  address: string,
  phone: string,
): Branch {
  return {
    id,
    name,
    legalName: GUP_LEGAL,
    address,
    phone,
    ogrn: GUP_OGRN,
  };
}

export const DEMO_BRANCHES: Branch[] = [
  branch(
    'b-vlad',
    'Владикавказский',
    '362040, г. Владикавказ, ул. Гаражная, д. 1',
    '+7 (8672) 40-00-01',
  ),
  branch(
    'b-prav',
    'Правобережный',
    '363029, г. Беслан, ул. Промышленная, д. 8',
    '+7 (86737) 2-00-02',
  ),
  branch(
    'b-kirov',
    'Кировский',
    '363600, с. Эльхотово, ул. Центральная, д. 12',
    '+7 (86735) 2-00-03',
  ),
  branch(
    'b-digor',
    'Дигорский',
    '363410, г. Дигора, ул. Ленина, д. 5',
    '+7 (86733) 2-00-04',
  ),
  branch(
    'b-ardon',
    'Ардонский',
    '363330, г. Ардон, ул. Транспортная, д. 3',
    '+7 (86732) 2-00-05',
  ),
  branch(
    'b-alag',
    'Алагирский',
    '363240, г. Алагир, ул. Мира, д. 17',
    '+7 (86731) 2-00-06',
  ),
  branch(
    'b-arkh',
    'Архонский',
    '363121, с. Архонская, ул. Советская, д. 9',
    '+7 (8672) 40-00-07',
  ),
  branch(
    'b-mozd',
    'Моздокский',
    '363750, г. Моздок, ул. Кирова, д. 22',
    '+7 (86736) 2-00-08',
  ),
  branch(
    'b-prig',
    'Пригородный',
    '363110, с. Октябрьское, ул. Гагарина, д. 4',
    '+7 (8672) 40-00-09',
  ),
];

/** @deprecated используйте DEMO_BRANCHES[0] */
export const DEMO_BRANCH = DEMO_BRANCHES[0];

/** Справочник типов техники для заявок (независимо от текущего парка) */
export const REQUEST_CATEGORIES = [
  'Экскаватор-погрузчик',
  'Экскаватор',
  'Самосвал',
  'Автокран',
  'Мини-погрузчик',
  'Бульдозер',
  'Погрузчик',
  'Автогрейдер',
  'Каток',
] as const;

/** Учётные записи для переключения ролей */
export const DEMO_STAFF: StaffUser[] = [
  {
    id: 'u-gup-dispatcher',
    name: 'Сергей Осетинский',
    initials: 'СО',
    role: 'gup_dispatcher',
    branchId: GUP_SCOPE_ID,
  },
  {
    id: 'u-dispatcher',
    name: 'Анна Миронова',
    initials: 'АМ',
    role: 'dispatcher',
    branchId: 'b-vlad',
  },
  {
    id: 'u-dispatcher-prav',
    name: 'Марк Дроздов',
    initials: 'МД',
    role: 'dispatcher',
    branchId: 'b-prav',
  },
  {
    id: 'u-chief',
    name: 'Ирина Савельева',
    initials: 'ИС',
    role: 'branch_chief',
    branchId: 'b-vlad',
  },
  {
    id: 'u-dept',
    name: 'Пётр Кузнецов',
    initials: 'ПК',
    role: 'department_head',
    branchId: 'b-vlad',
  },
  {
    id: 'u-deputy',
    name: 'Ольга Сидорова',
    initials: 'ОС',
    role: 'deputy',
    branchId: 'b-vlad',
  },
  {
    id: 'u-mechanic',
    name: 'Валерий Громов',
    initials: 'ВГ',
    role: 'mechanic',
    branchId: 'b-vlad',
  },
  {
    id: 'u-master',
    name: 'Денис Крылов',
    initials: 'ДК',
    role: 'master',
    branchId: 'b-vlad',
  },
];

export const INITIAL_DRIVERS: Driver[] = [];
export const INITIAL_FLEET: Vehicle[] = [];
export const INITIAL_JOBS: Job[] = [];
export const INITIAL_REQUESTS: Request[] = [];
export const INITIAL_WAYBILLS: Waybill[] = [];
export const INITIAL_TIMESHEET: TimesheetEntry[] = [];
export const INITIAL_FUELINGS: Fueling[] = [];
export const INITIAL_EVENTS: GarageEvent[] = [];
export const DISPATCHERS: Dispatcher[] = [];
