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
  label: string;
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

export const TRANSPORT_UNIT_SHORT = "ТУ РПВВ";
export const TRANSPORT_UNIT_LABEL = "Транспортное управление РПВВ";

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

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    staffId: "u-senior-dispatcher",
    role: "senior_dispatcher",
    workspace: "dispatcher",
    label: "Сергей · старший дисп.",
    name: "Сергей Осетинский",
    initials: "СО",
    branchId: null,
  },
  {
    staffId: "u-transport-chief",
    role: "transport_chief",
    workspace: "dispatcher",
    label: "Алан · нач. ТУ",
    name: "Алан Бероев",
    initials: "АБ",
    branchId: null,
  },
  {
    staffId: "u-transport-deputy",
    role: "transport_deputy",
    workspace: "dispatcher",
    label: "Зарина · зам. ТУ",
    name: "Зарина Кадзаева",
    initials: "ЗК",
    branchId: null,
  },
  {
    staffId: "u-dispatcher",
    role: "dispatcher",
    workspace: "dispatcher",
    label: "Анна · дисп. Владикавказ",
    name: "Анна Миронова",
    initials: "АМ",
    branchId: "b-vlad",
  },
  {
    staffId: "u-dispatcher-prav",
    role: "dispatcher",
    workspace: "dispatcher",
    label: "Марк · дисп. Правобережный",
    name: "Марк Дроздов",
    initials: "МД",
    branchId: "b-prav",
  },
  {
    staffId: "u-chief",
    role: "branch_chief",
    workspace: "branch_chief",
    label: "Ирина · нач. Владикавказ",
    name: "Ирина Савельева",
    initials: "ИС",
    branchId: "b-vlad",
  },
  {
    staffId: "u-dept",
    role: "department_head",
    workspace: "applicant",
    label: "Пётр · нач. отдела",
    name: "Пётр Кузнецов",
    initials: "ПК",
    branchId: "b-vlad",
  },
  {
    staffId: "u-deputy",
    role: "deputy",
    workspace: "applicant",
    label: "Ольга · зам филиала",
    name: "Ольга Сидорова",
    initials: "ОС",
    branchId: "b-vlad",
  },
  {
    staffId: "u-mechanic",
    role: "mechanic",
    workspace: "applicant",
    label: "Валерий · механик",
    name: "Валерий Громов",
    initials: "ВГ",
    branchId: "b-vlad",
  },
  {
    staffId: "u-master",
    role: "master",
    workspace: "applicant",
    label: "Денис · мастер",
    name: "Денис Крылов",
    initials: "ДК",
    branchId: "b-vlad",
  },
];

export const DEFAULT_PERSONA = DEMO_PERSONAS[0];

export function personaByStaffId(staffId: string) {
  return DEMO_PERSONAS.find((item) => item.staffId === staffId) ?? DEFAULT_PERSONA;
}
