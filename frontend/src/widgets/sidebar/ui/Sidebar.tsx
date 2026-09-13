import {
  ArrowUpRight,
  ChevronRight,
  ClipboardList,
  Construction,
  LayoutDashboard,
  Radio,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { Dispatcher } from "@/entities/garage";
import type { WorkspaceSection } from "@/shared/config";
import { cx } from "@/shared/lib";
import { Avatar } from "@/shared/ui";
import styles from "@/shared/styles/layout.module.css";

const NAV = [
  { id: "dispatch" as const, label: "Диспетчерская", icon: LayoutDashboard },
  { id: "fleet" as const, label: "Парк техники", icon: Truck },
  { id: "requests" as const, label: "Заявки", icon: ClipboardList },
  { id: "team" as const, label: "Команда", icon: Users },
  { id: "service" as const, label: "Обслуживание", icon: Wrench },
];

export function Sidebar({
  view,
  onNavigate,
  pending,
  service,
  dispatchers,
  open,
}: {
  view: WorkspaceSection;
  onNavigate: (view: WorkspaceSection) => void;
  pending: number;
  service: number;
  dispatchers: Dispatcher[];
  open: boolean;
}) {
  return (
    <aside className={cx(styles.sidebar, open && styles.sidebarOpen)}>
      <div className={styles.brandHeader}>
        <button className={styles.brand} onClick={() => onNavigate("dispatch")} aria-label="ТЯГА — диспетчерская">
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
          <strong>Основной гараж</strong>
          <small>Парк № 01</small>
        </div>
        <span className={styles.garageNo}>01</span>
      </div>

      <p className={styles.navCaption}>РАБОЧЕЕ ПРОСТРАНСТВО</p>
      <nav className={styles.navMenu}>
        {NAV.map((item) => (
          <button
            key={item.id}
            className={cx(styles.navButton, view === item.id && styles.navActive)}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {item.id === "requests" && pending > 0 && <b className={styles.navCount}>{pending}</b>}
            {item.id === "service" && service > 0 && <span className={styles.navServiceDot} />}
          </button>
        ))}
      </nav>

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

      <div className={styles.sidebarFooter}>
        <button className={styles.profile} onClick={() => onNavigate("team")}>
          <Avatar initials="АМ" color="violet" />
          <span>
            <strong>Анна Миронова</strong>
            <small>Старший диспетчер</small>
          </span>
          <ChevronRight size={16} />
        </button>
      </div>
    </aside>
  );
}
