import {
  ArrowUpRight,
  ChevronRight,
  ClipboardList,
  Construction,
  FileText,
  Fuel,
  LayoutDashboard,
  Radio,
  Table2,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { Dispatcher } from "@/entities/garage";
import type { DemoPersona, WorkspaceSection } from "@/shared/config";
import { ROLE_LABEL } from "@/shared/config";
import { cx } from "@/shared/lib";
import { Avatar } from "@/shared/ui";
import styles from "@/shared/styles/layout.module.css";

const ICONS: Partial<Record<WorkspaceSection, typeof LayoutDashboard>> = {
  dispatch: LayoutDashboard,
  fleet: Truck,
  requests: ClipboardList,
  waybills: FileText,
  timesheet: Table2,
  fuel: Fuel,
  team: Users,
  service: Wrench,
  "my-requests": ClipboardList,
  "branch-requests": ClipboardList,
};

export function Sidebar({
  view,
  nav,
  onNavigate,
  pending,
  service,
  dispatchers,
  persona,
  branchName,
  open,
  showShift = true,
}: {
  view: WorkspaceSection;
  nav: { id: WorkspaceSection; label: string }[];
  onNavigate: (view: WorkspaceSection) => void;
  pending: number;
  service: number;
  dispatchers: Dispatcher[];
  persona: DemoPersona;
  branchName: string;
  open: boolean;
  showShift?: boolean;
}) {
  return (
    <aside className={cx(styles.sidebar, open && styles.sidebarOpen)}>
      <div className={styles.brandHeader}>
        <button className={styles.brand} onClick={() => onNavigate(nav[0].id)} aria-label="ТЯГА — диспетчерская">
          <span className={styles.brandMark}>
            <ArrowUpRight strokeWidth={3} size={28} />
          </span>
          <span>
            ТЯГА<span className={styles.brandPeriod}>.</span>
          </span>
        </button>
        <span className={styles.brandCaption}>УПРАВЛЕНИЕ СПЕЦТЕХНИКОЙ</span>
      </div>

      <div className={styles.garageLabel}>
        <span className={styles.garageSymbol}>
          <Construction size={18} />
        </span>
        <div>
          <strong>{branchName}</strong>
          <small>Парк № 01</small>
        </div>
        <span className={styles.garageNo}>01</span>
      </div>

      <p className={styles.navCaption}>РАБОЧЕЕ ПРОСТРАНСТВО</p>
      <nav className={styles.navMenu}>
        {nav.map((item) => {
          const Icon = ICONS[item.id] ?? ClipboardList;
          return (
            <button
              key={item.id}
              className={cx(styles.navButton, view === item.id && styles.navActive)}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.id === "requests" && pending > 0 && <b className={styles.navCount}>{pending}</b>}
              {item.id === "service" && service > 0 && <span className={styles.navServiceDot} />}
            </button>
          );
        })}
      </nav>

      {showShift && (
        <div className={styles.shift}>
          <div className={styles.shiftEyebrow}>
            <Radio size={14} /> ДНЕВНАЯ СМЕНА
          </div>
          <p>
            Люди, которые
            <br />
            держат всё в движении.
          </p>
          <div className={styles.shiftAvatars}>
            {dispatchers.map((dispatcher) => (
              <Avatar
                key={dispatcher.initials}
                initials={dispatcher.initials}
                color={dispatcher.color as "violet" | "peach" | "mint"}
              />
            ))}
            <span className={styles.onDuty}>
              3 диспетчера
              <br />
              <b>на смене</b>
            </span>
          </div>
          <button className={styles.shiftLink} onClick={() => onNavigate("team")}>
            Состав смены <ArrowUpRight size={16} />
          </button>
        </div>
      )}

      <div className={styles.sidebarFooter}>
        <div className={styles.profile}>
          <Avatar initials={persona.initials} color="violet" />
          <span>
            <strong>{persona.name}</strong>
            <small>{ROLE_LABEL[persona.role]}</small>
          </span>
          <ChevronRight size={16} />
        </div>
      </div>
    </aside>
  );
}
