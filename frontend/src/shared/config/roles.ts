export type StaffRole =
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
};

export const ROLE_LABEL: Record<StaffRole, string> = {
  dispatcher: "Диспетчер",
  branch_chief: "Начальник филиала",
  department_head: "Начальник отдела",
  deputy: "Зам. начальника",
  mechanic: "Механик",
  master: "Мастер",
};

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    staffId: "u-dispatcher",
    role: "dispatcher",
    workspace: "dispatcher",
    label: "Анна · диспетчер",
    name: "Анна Миронова",
    initials: "АМ",
  },
  {
    staffId: "u-chief",
    role: "branch_chief",
    workspace: "branch_chief",
    label: "Ирина · нач. филиала",
    name: "Ирина Савельева",
    initials: "ИС",
  },
  {
    staffId: "u-dept",
    role: "department_head",
    workspace: "applicant",
    label: "Пётр · нач. отдела",
    name: "Пётр Кузнецов",
    initials: "ПК",
  },
  {
    staffId: "u-deputy",
    role: "deputy",
    workspace: "applicant",
    label: "Ольга · зам",
    name: "Ольга Сидорова",
    initials: "ОС",
  },
  {
    staffId: "u-mechanic",
    role: "mechanic",
    workspace: "applicant",
    label: "Валерий · механик",
    name: "Валерий Громов",
    initials: "ВГ",
  },
  {
    staffId: "u-master",
    role: "master",
    workspace: "applicant",
    label: "Денис · мастер",
    name: "Денис Крылов",
    initials: "ДК",
  },
];

export const DEFAULT_PERSONA = DEMO_PERSONAS[0];

export function personaByStaffId(staffId: string) {
  return DEMO_PERSONAS.find((item) => item.staffId === staffId) ?? DEFAULT_PERSONA;
}
