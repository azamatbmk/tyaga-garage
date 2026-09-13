import { ArrowUpRight, Check, Clock3, MapPin } from "lucide-react";
import { cx, formatTime } from "@/shared/lib";
import { ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";
import type { RequestItem } from "../model";

export function RequestCard({
  request,
  onOpen,
}: {
  request: RequestItem;
  onOpen: () => void;
}) {
  return (
    <article className={cx(styles.requestCard, request.urgent && styles.requestUrgent)}>
      <div className={styles.requestTop}>
        <span className={ui.mono}>№ {request.id}</span>
        {request.assigned ? (
          <span className={styles.assignedLabel}>
            <Check size={13} />
            Назначена
          </span>
        ) : request.urgent ? (
          <span className={styles.urgentLabel}>Приоритетная</span>
        ) : (
          <span className={ui.mono}>
            {formatTime(request.start)}–{formatTime(request.end)}
          </span>
        )}
      </div>
      <h3>{request.title}</h3>
      <p className={styles.requestLocation}>
        <MapPin size={13} />
        {request.location}
      </p>
      {request.urgent && (
        <p className={styles.priorityWindow}>
          <Clock3 size={12} />
          {formatTime(request.start)}–{formatTime(request.end)}
        </p>
      )}
      <div className={styles.requestBottom}>
        <span>{request.category}</span>
        <button
          className={styles.roundArrow}
          aria-label={
            request.assigned
              ? `Открыть технику заявки ${request.id}`
              : `Назначить технику на заявку ${request.id}`
          }
          onClick={onOpen}
        >
          <ArrowUpRight size={18} />
        </button>
      </div>
    </article>
  );
}
