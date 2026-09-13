export type WorkspaceSection = "dispatch" | "fleet" | "requests" | "team" | "service";

export const NAV: { id: WorkspaceSection; label: string }[] = [
  { id: "dispatch", label: "Диспетчерская" },
  { id: "fleet", label: "Парк техники" },
  { id: "requests", label: "Заявки" },
  { id: "team", label: "Команда" },
  { id: "service", label: "Обслуживание" },
];

export const PAGE_COPY: Record<WorkspaceSection, string> = {
  dispatch: "Каждая машина на своём месте. Каждый выезд под контролем.",
  fleet: "Состояние, загрузка и готовность каждой единицы техники.",
  requests: "От новой задачи до назначенного экипажа.",
  team: "Диспетчеры и экипажи сегодняшней смены.",
  service: "Плановые работы и возвращение техники в строй.",
};
