export type StaffRole =
  | "gup_dispatcher"
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
  /** Филиал персоны; null у диспетчера ГУП */
  branchId: string | null;
};

export const ROLE_LABEL: Record<StaffRole, string> = {
  gup_dispatcher: "Диспетчер ГУП",
  dispatcher: "Диспетчер филиала",
  branch_chief: "Начальник филиала",
  department_head: "Начальник отдела",
  deputy: "Зам. начальника",
  mechanic: "Механик",
  master: "Мастер",
};

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    staffId: "u-gup-dispatcher",
    role: "gup_dispatcher",
    workspace: "dispatcher",
    label: "Сергей · дисп. ГУП",
    name: "Сергей Осетинский",
    initials: "СО",
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
    label: "Ольга · зам",
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
