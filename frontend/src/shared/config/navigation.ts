export type WorkspaceSection =
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

export const APPLICANT_NAV: { id: WorkspaceSection; label: string }[] = [
  { id: "my-requests", label: "Мои заявки" },
];

export const BRANCH_NAV: { id: WorkspaceSection; label: string }[] = [
  { id: "branch-requests", label: "Заявки филиала" },
];

/** @deprecated use DISPATCHER_NAV — kept for Header breadcrumbs fallback */
export const NAV = DISPATCHER_NAV;

export const PAGE_COPY: Partial<Record<WorkspaceSection, string>> = {
  dispatch: "Каждая машина на своём месте. Каждый выезд под контролем.",
  fleet: "Состояние, загрузка и готовность каждой единицы техники.",
  requests: "От новой задачи до назначенного экипажа.",
  waybills: "Путевые по приказу Минтранса № 390: срок, ТС, водитель, медосмотр, контроль.",
  timesheet: "Табель ГУП: сверхурочные и выходные от заявок.",
  fuel: "Заправки по чекам и топливной программе.",
  team: "Диспетчеры и экипажи сегодняшней смены.",
  service: "Плановые работы и возвращение техники в строй.",
  "my-requests": "Ваши заявки на технику. Статус и создание новых.",
  "branch-requests": "Все заявки филиала для контроля.",
};
