export type WorkspaceSection =
  | "branches"
  | "dispatch"
  | "fleet"
  | "requests"
  | "team"
  | "service"
  | "waybills"
  | "timesheet"
  | "fuel"
  | "my-requests"
  | "branch-requests";

export const DISPATCHER_NAV: { id: WorkspaceSection; label: string }[] = [
  { id: "dispatch", label: "Диспетчерская" },
  { id: "requests", label: "Заявки" },
  { id: "fleet", label: "Парк техники" },
  { id: "team", label: "Команда" },
  { id: "service", label: "Обслуживание" },
];

/** Вкладки внутри «Парк техники» */
export type FleetTab = "units" | "waybills" | "timesheet" | "fuel";

export const FLEET_TABS: { id: FleetTab; label: string }[] = [
  { id: "units", label: "Техника" },
  { id: "waybills", label: "Путевые" },
  { id: "timesheet", label: "Табель" },
  { id: "fuel", label: "Топливо" },
];

export const FLEET_TAB_COPY: Record<FleetTab, string> = {
  units: "Парк: статус и куда назначена каждая машина. Добавление — вручную или со скана ПТС/СТС.",
  waybills: "Выдача на любой срок: километраж вручную, печать по приказу № 390.",
  timesheet: "Табель ГУП: сверхурочные и выходные от заявок.",
  fuel: "Заправки по чекам и топливной программе.",
};

/** Аппарат ТУ РПВВ: операционка + контроль всех филиалов */
export const GUP_DISPATCHER_NAV: { id: WorkspaceSection; label: string }[] = [
  DISPATCHER_NAV[0],
  DISPATCHER_NAV[1],
  { id: "branches", label: "Филиалы" },
  ...DISPATCHER_NAV.slice(2),
];

export const APPLICANT_NAV: { id: WorkspaceSection; label: string }[] = [
  { id: "my-requests", label: "Мои заявки" },
];

export const BRANCH_NAV: { id: WorkspaceSection; label: string }[] = [
  { id: "branch-requests", label: "Заявки филиала" },
];

export const PAGE_COPY: Partial<Record<WorkspaceSection, string>> = {
  branches: "Контроль филиалов из ТУ РПВВ: очередь, парк и куда назначена техника.",
  dispatch: "Каждая машина на своём месте. Каждый выезд под контролем.",
  fleet: "Техника, путевые, табель и топливо — всё по парку.",
  requests: "От новой задачи до назначенного экипажа.",
  team: "Диспетчеры и экипажи сегодняшней смены.",
  service: "Плановые работы и возвращение техники в строй.",
  "my-requests": "Ваши заявки на технику. Статус и создание новых.",
  "branch-requests": "Все заявки филиала для контроля.",
};
