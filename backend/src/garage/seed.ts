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

const GUP_LEGAL = 'ГУП РПВВ';
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

/** Только филиалы. ТУ РПВВ — аппарат ГУП, не филиал. */
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
    id: 'u-transport-chief',
    name: 'Алан Бероев',
    initials: 'АБ',
    role: 'transport_chief',
    branchId: GUP_SCOPE_ID,
  },
  {
    id: 'u-transport-deputy',
    name: 'Зарина Кадзаева',
    initials: 'ЗК',
    role: 'transport_deputy',
    branchId: GUP_SCOPE_ID,
  },
  {
    id: 'u-senior-dispatcher',
    name: 'Сергей Осетинский',
    initials: 'СО',
    role: 'senior_dispatcher',
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

/** По одной машине на филиал — чтобы тестировать раздел «Филиалы». */
const SEED_BRANCH_FLEET: {
  branchId: string;
  id: string;
  name: string;
  category: string;
  plate: string;
  driver: string;
  initials: string;
  capacity: string;
  status: Vehicle['status'];
  fuel: number;
  hours: number;
}[] = [
  {
    branchId: 'b-vlad',
    id: '01',
    name: 'JCB 3CX',
    category: 'Экскаватор-погрузчик',
    plate: 'А 101 АА · 15',
    driver: 'Алан Цгоев',
    initials: 'АЦ',
    capacity: 'Ковш 1 м³',
    status: 'ready',
    fuel: 82,
    hours: 2140,
  },
  {
    branchId: 'b-prav',
    id: '02',
    name: 'КАМАЗ-65115',
    category: 'Самосвал',
    plate: 'В 202 ВВ · 15',
    driver: 'Борис Дзагоев',
    initials: 'БД',
    capacity: '15 т',
    status: 'working',
    fuel: 64,
    hours: 980,
  },
  {
    branchId: 'b-kirov',
    id: '03',
    name: 'Hitachi ZX200',
    category: 'Экскаватор',
    plate: 'Е 303 ЕЕ · 15',
    driver: 'Георгий Битиев',
    initials: 'ГБ',
    capacity: '1 м³',
    status: 'ready',
    fuel: 71,
    hours: 1560,
  },
  {
    branchId: 'b-digor',
    id: '04',
    name: 'ГАз-3309',
    category: 'Самосвал',
    plate: 'К 404 КК · 15',
    driver: 'Давид Мамиев',
    initials: 'ДМ',
    capacity: '5 т',
    status: 'reserved',
    fuel: 55,
    hours: 720,
  },
  {
    branchId: 'b-ardon',
    id: '05',
    name: 'Bobcat S650',
    category: 'Мини-погрузчик',
    plate: 'М 505 ММ · 15',
    driver: 'Заур Хубаев',
    initials: 'ЗХ',
    capacity: '0,5 м³',
    status: 'ready',
    fuel: 90,
    hours: 410,
  },
  {
    branchId: 'b-alag',
    id: '06',
    name: 'ДЗ-98',
    category: 'Автогрейдер',
    plate: 'Н 606 НН · 15',
    driver: 'Игорь Кайтуков',
    initials: 'ИК',
    capacity: 'Отвал 3,7 м',
    status: 'service',
    fuel: 38,
    hours: 3010,
  },
  {
    branchId: 'b-arkh',
    id: '07',
    name: 'Liebherr LTM',
    category: 'Автокран',
    plate: 'О 707 ОО · 15',
    driver: 'Казбек Гуриев',
    initials: 'КГ',
    capacity: '50 т',
    status: 'ready',
    fuel: 77,
    hours: 1880,
  },
  {
    branchId: 'b-mozd',
    id: '08',
    name: 'Shantui SD16',
    category: 'Бульдозер',
    plate: 'Р 808 РР · 15',
    driver: 'Леонид Томаев',
    initials: 'ЛТ',
    capacity: '3 м³',
    status: 'working',
    fuel: 48,
    hours: 2450,
  },
  {
    branchId: 'b-prig',
    id: '09',
    name: 'XCMG XS183',
    category: 'Каток',
    plate: 'С 909 СС · 15',
    driver: 'Мурат Дзуцев',
    initials: 'МД',
    capacity: '18 т',
    status: 'ready',
    fuel: 66,
    hours: 890,
  },
];

export const INITIAL_DRIVERS: Driver[] = SEED_BRANCH_FLEET.map((item) => ({
  id: `d-${item.id}`,
  fullName: item.driver,
  initials: item.initials,
  licenseCategory: 'C',
  licenseSeries: '15 АА',
  licenseNumber: `10${item.id}01`,
  licenseIssuedAt: '2020-01-01',
  snils: `000-000-0${item.id} 00`,
}));

export const INITIAL_FLEET: Vehicle[] = SEED_BRANCH_FLEET.map((item) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  plate: item.plate,
  driver: item.driver,
  initials: item.initials,
  driverId: `d-${item.id}`,
  branchId: item.branchId,
  status: item.status,
  fuel: item.fuel,
  hours: item.hours,
  capacity: item.capacity,
}));

export const INITIAL_JOBS: Job[] = [
  {
    id: 9001,
    vehicle: '02',
    title: 'Вывоз грунта',
    location: 'Беслан, Промзона',
    start: 8,
    end: 14,
    tone: 'lime',
  },
  {
    id: 9002,
    vehicle: '04',
    title: 'Подвоз щебня',
    location: 'Дигора, ул. Ленина',
    start: 10,
    end: 16,
    tone: 'reserved',
  },
  {
    id: 9003,
    vehicle: '08',
    title: 'Планировка площадки',
    location: 'Моздок, Кирова',
    start: 9,
    end: 15,
    tone: 'lime',
  },
];

export const INITIAL_REQUESTS: Request[] = [
  {
    id: 9002,
    title: 'Подвоз щебня',
    location: 'Дигора, ул. Ленина',
    category: 'Самосвал',
    start: 10,
    end: 16,
    urgent: false,
    branchId: 'b-digor',
    creatorId: 'u-senior-dispatcher',
    assigned: '04',
  },
  {
    id: 9010,
    title: 'Расчистка кювета',
    location: 'Эльхотово, Центральная',
    category: 'Экскаватор',
    start: 11,
    end: 17,
    urgent: true,
    branchId: 'b-kirov',
    creatorId: 'u-senior-dispatcher',
  },
];

export const INITIAL_WAYBILLS: Waybill[] = [];
export const INITIAL_TIMESHEET: TimesheetEntry[] = [];
export const INITIAL_FUELINGS: Fueling[] = [];
export const INITIAL_EVENTS: GarageEvent[] = [];
export const DISPATCHERS: Dispatcher[] = [];
