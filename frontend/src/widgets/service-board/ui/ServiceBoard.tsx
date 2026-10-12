import { ArrowUpRight, Clock3, ShieldCheck } from "lucide-react";
import { StatusBadge, VehicleIcon, type Vehicle } from "@/entities/vehicle";
import { ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";

export function ServiceBoard({
  fleet,
  onSelect,
}: {
  fleet: Vehicle[];
  onSelect: (id: string) => void;
}) {
  const service = fleet.filter((item) => item.status === "service");
  const healthy = fleet.length - service.length;
  const healthyPct = fleet.length === 0 ? 0 : Math.round((healthy / fleet.length) * 100);

  return (
    <>
      <div className={styles.serviceBanner}>
        <span className={styles.serviceIcon}>
          <ShieldCheck size={30} />
        </span>
        <div>
          <h2>
            {fleet.length === 0
              ? "В парке пока нет техники"
              : `${healthy} из ${fleet.length} единиц исправны`}
          </h2>
          <p>
            {fleet.length === 0
              ? "Добавьте машины в разделе «Парк техники»."
              : "Техника на обслуживании недоступна для назначения на заявки."}
          </p>
        </div>
        <span className={styles.serviceNumber}>
          {healthyPct}
          <small>%</small>
        </span>
      </div>
      <div className={styles.serviceGrid}>
        {service.map((vehicle) => (
          <article className={`${styles.panel} ${styles.serviceCard}`} key={vehicle.id}>
            <div className={styles.serviceCardHeading}>
              <VehicleIcon category={vehicle.category} status="service" size={32} />
              <StatusBadge status={vehicle.status} />
            </div>
            <h2>{vehicle.name}</h2>
            <p className={ui.muted}>
              {vehicle.plate} · {vehicle.hours.toLocaleString("ru-RU")} м/ч
            </p>
            <div className={styles.serviceWork}>
              <div className={ui.muted}>ОБСЛУЖИВАНИЕ</div>
              <h3>Плановые работы</h3>
              <p>Водитель: {vehicle.driver}</p>
              <div className={styles.serviceDue}>
                <Clock3 size={15} />
                Статус: на обслуживании
              </div>
            </div>
            <button className={`${ui.secondaryButton} ${ui.wide}`} onClick={() => onSelect(vehicle.id)}>
              Открыть карточку <ArrowUpRight size={16} />
            </button>
          </article>
        ))}
      </div>
      {service.length === 0 && fleet.length > 0 && (
        <div className={`${styles.panel} ${ui.empty}`}>
          <ShieldCheck size={38} />
          <h3>Вся техника в строю</h3>
          <p>Открытых работ по обслуживанию нет.</p>
        </div>
      )}
    </>
  );
}
