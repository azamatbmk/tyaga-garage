import { X } from "lucide-react";
import type { GarageEvent } from "@/entities/garage";
import { SidePanel, ui } from "@/shared/ui";
import styles from "@/shared/styles/overlays.module.css";

export function EventsSheet({
  open,
  events,
  onClose,
}: {
  open: boolean;
  events: GarageEvent[];
  onClose: () => void;
}) {
  return (
    <SidePanel open={open} onClose={onClose}>
      <header className={styles.header}>
        <div className={styles.kicker}>
          <span className={styles.eyebrow}>12 СЕНТЯБРЯ / СМЕНА 01</span>
          <button className={ui.iconButton} aria-label="Закрыть события" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <h2 className={styles.name}>Пульс гаража</h2>
        <p className={styles.description}>События техники, заявок и экипажей</p>
      </header>
      <div className={styles.events}>
        {events.map((event, index) => (
          <div className={styles.event} key={`${event.title}-${index}`}>
            <span className={ui.mono}>{event.time}</span>
            <div>
              <h3>{event.title}</h3>
              <p>{event.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </SidePanel>
  );
}
