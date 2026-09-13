import { ArrowUpRight, Clock3, Radio } from "lucide-react";
import type { Dispatcher } from "@/entities/garage";
import { StatusBadge, type Vehicle } from "@/entities/vehicle";
import { Avatar, ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";

const ROLES = ["Гараж и заявки", "Объекты и выезды", "Экипажи и возвраты"];

export function TeamBoard({
  dispatchers,
  fleet,
  onSelect,
}: {
  dispatchers: Dispatcher[];
  fleet: Vehicle[];
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className={styles.sectionTitle}>
        <h2>Диспетчеры</h2>
        <span className={styles.subtleBadge}>
          <Radio size={14} />3 на смене
        </span>
      </div>
      <div className={styles.dispatchers}>
        {dispatchers.map((dispatcher, index) => (
          <article className={`${styles.panel} ${styles.dispatcher}`} key={dispatcher.initials}>
            <div className={styles.dispatcherTop}>
              <Avatar
                initials={dispatcher.initials}
                color={dispatcher.color as "violet" | "peach" | "mint"}
                size="large"
              />
              <StatusBadge status="ready" />
            </div>
            <h2>{dispatcher.name}</h2>
            <p>{dispatcher.role}</p>
            <div className={styles.dispatcherBottom}>
              <span>
                <Clock3 size={15} />
                {dispatcher.time}
              </span>
              <b>{ROLES[index]}</b>
            </div>
          </article>
        ))}
      </div>
      <div className={`${styles.sectionTitle} ${styles.crewHeading}`}>
        <h2>Водители и машинисты</h2>
        <span className={ui.muted}>Закреплены за техникой</span>
      </div>
      <section className={styles.panel}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Техника</th>
              <th>Занятость</th>
              <th>Смена</th>
              <th>
                <span className={ui.srOnly}>Карточка</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {fleet.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>
                  <span className={ui.driverCell}>
                    <Avatar initials={vehicle.initials} />
                    <strong>{vehicle.driver}</strong>
                  </span>
                </td>
                <td>
                  {vehicle.name}
                  <small className={styles.cellSmall}>{vehicle.category}</small>
                </td>
                <td>
                  <StatusBadge status={vehicle.status} />
                </td>
                <td className={ui.mono}>08:00–20:00</td>
                <td>
                  <button
                    className={ui.iconButton}
                    onClick={() => onSelect(vehicle.id)}
                    aria-label={`Открыть технику: ${vehicle.driver}`}
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
