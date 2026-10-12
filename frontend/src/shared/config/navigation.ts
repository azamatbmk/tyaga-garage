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
  { id: "fleet", label: "Парк техники" },
  { id: "requests", label: "Заявки" },
  { id: "waybills", label: "Путевые" },
  { id: "timesheet", label: "Табель" },
  { id: "fuel", label: "Топливо" },
  { id: "team", label: "Команда" },
  { id: "service", label: "Обслуживание" },
];

/** Диспетчер ГУП: полный UI филиала + сводка по всем филиалам */
export const GUP_DISPATCHER_NAV: { id: WorkspaceSection; label: string }[] = [
  { id: "branches", label: "Филиалы" },
  ...DISPATCHER_NAV,
];

export const APPLICANT_NAV: { id: WorkspaceSection; label: string }[] = [
  { id: "my-requests", label: "Мои заявки" },
];

export const BRANCH_NAV: { id: WorkspaceSection; label: string }[] = [
  { id: "branch-requests", label: "Заявки филиала" },
];

export const PAGE_COPY: Partial<Record<WorkspaceSection, string>> = {
  branches: "Контроль филиалов: очередь, назначения и парк. Можно назначить технику прямо отсюда.",
  dispatch: "Каждая машина на своём месте. Каждый выезд под контролем.",
  fleet: "Состояние парка. Новую машину можно внести вручную или со скана техпаспорта.",
  requests: "От новой задачи до назначенного экипажа.",
  waybills: "Выдача на любой срок: километраж вручную, печать по приказу № 390.",
  timesheet: "Табель ГУП: сверхурочные и выходные от заявок.",
  fuel: "Заправки по чекам и топливной программе.",
  team: "Диспетчеры и экипажи сегодняшней смены.",
  service: "Плановые работы и возвращение техники в строй.",
  "my-requests": "Ваши заявки на технику. Статус и создание новых.",
  "branch-requests": "Все заявки филиала для контроля.",
};
