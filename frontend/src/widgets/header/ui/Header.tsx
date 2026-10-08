import { Bell, CalendarDays, ChevronRight, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { DISPATCHER_NAV, type WorkspaceSection } from "@/shared/config";
import { Avatar } from "@/shared/ui";
import styles from "@/shared/styles/layout.module.css";

export function Header({
  view,
  viewLabel,
  unread,
  onOpenMenu,
  onOpenEvents,
  onOpenTeam,
  showEvents = true,
  roleSwitcher,
}: {
  view: WorkspaceSection;
  viewLabel?: string;
  unread: boolean;
  onOpenMenu: () => void;
  onOpenEvents: () => void;
  onOpenTeam?: () => void;
  showEvents?: boolean;
  roleSwitcher?: ReactNode;
}) {
  const label =
    viewLabel ?? DISPATCHER_NAV.find((item) => item.id === view)?.label ?? "Рабочее место";

  return (
    <header className={styles.topbar}>
      <div className={styles.breadcrumbs}>
        <button className={styles.mobileMenu} aria-label="Открыть меню" onClick={onOpenMenu}>
          <Menu size={20} />
        </button>
        <span className={styles.breadcrumbParent}>Рабочее пространство</span>
        <ChevronRight size={14} />
        <span>{label}</span>
      </div>
      <div className={styles.topbarRight}>
        {roleSwitcher}
        <span className={styles.demoBadge} title="Демонстрационные данные. Изменения живут на сервере до его перезапуска.">
          ДЕМО
        </span>
        <span className={styles.topbarDate}>
          <CalendarDays size={15} />
          12 сентября 2026
        </span>
        {showEvents && (
          <button className={styles.notification} aria-label="Открыть события смены" onClick={onOpenEvents}>
            <Bell size={20} />
            {unread && <span className={styles.notificationDot} />}
          </button>
        )}
        {onOpenTeam && (
          <button onClick={onOpenTeam} aria-label="Команда диспетчеров">
            <Avatar initials="АМ" color="violet" />
          </button>
        )}
      </div>
    </header>
  );
}
