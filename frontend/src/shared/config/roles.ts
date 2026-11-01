export type StaffRole =
  | "transport_chief"
  | "transport_deputy"
  | "senior_dispatcher"
  | "dispatcher"
  | "branch_chief"
  | "department_head"
  | "deputy"
  | "mechanic"
  | "master";

export type WorkspaceKind = "dispatcher" | "branch_chief" | "applicant";

export type DemoPersona = {
  staffId: string;
  role: StaffRole;
  workspace: WorkspaceKind;
  name: string;
  initials: string;
  /** Филиал; null у аппарата ТУ РПВВ (видят все филиалы) */
  branchId: string | null;
};

/** Роли транспортного управления РПВВ — контроль всех филиалов */
export const TRANSPORT_UNIT_ROLES: readonly StaffRole[] = [
  "transport_chief",
  "transport_deputy",
  "senior_dispatcher",
] as const;

export function isTransportUnitRole(role: StaffRole): boolean {
  return (TRANSPORT_UNIT_ROLES as readonly string[]).includes(role);
}

export function workspaceForRole(role: StaffRole): WorkspaceKind {
  if (role === "branch_chief") return "branch_chief";
  if (role === "dispatcher" || isTransportUnitRole(role)) return "dispatcher";
  return "applicant";
}

export const TRANSPORT_UNIT_SHORT = "ТУ РПВВ";

export const ROLE_LABEL: Record<StaffRole, string> = {
  transport_chief: "Начальник ТУ",
  transport_deputy: "Зам. начальника ТУ",
  senior_dispatcher: "Старший диспетчер",
  dispatcher: "Диспетчер филиала",
  branch_chief: "Начальник филиала",
  department_head: "Начальник отдела",
  deputy: "Зам. начальника филиала",
  mechanic: "Механик",
  master: "Мастер",
};
