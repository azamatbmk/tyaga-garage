import {
  ArrowUpRight,
  CheckCheck,
  Construction,
  Fuel,
  MapPin,
  ShieldCheck,
  Timer,
  X,
} from "lucide-react";
import type { Job } from "@/entities/garage";
import type { RequestItem } from "@/entities/request";
import { StatusBadge, VehicleIcon, type Vehicle } from "@/entities/vehicle";
import { formatTime } from "@/shared/lib";
import { Avatar, Progress, SidePanel, ui } from "@/shared/ui";
import styles from "@/shared/styles/overlays.module.css";

export function VehicleSheet({
  vehicle,
  jobs,
  pending,
  onClose,
  onAssign,
  onFinishService,
}: {
  vehicle: Vehicle | null;
  jobs: Job[];
  pending: RequestItem[];
  onClose: () => void;
  onAssign: (request: RequestItem, preferred: string) => void;
  onFinishService: (vehicle: Vehicle) => void;
}) {
  const vehicleJobs = jobs.filter((job) => job.vehicle === vehicle?.id);

  return (
    <SidePanel open={!!vehicle} onClose={onClose}>
      {vehicle && (
        <>
          <header className={styles.header}>
            <div className={styles.kicker}>
              <span className={styles.eyebrow}>КАРТОЧКА ТЕХНИКИ / {vehicle.id}</span>
              <button className={ui.iconButton} aria-label="Закрыть карточку" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <span className={styles.vehicleArt}>
              <VehicleIcon category={vehicle.category} status={vehicle.status} size={74} framed={false} />
            </span>
            <h2 className={styles.name}>{vehicle.name}</h2>
            <p className={styles.description}>
              {vehicle.category} · {vehicle.plate}
            </p>
            <StatusBadge status={vehicle.status} />
          </header>
          <div className={styles.body}>
            <div className={styles.stats}>
              <div>
                <Fuel size={18} />
                <span>Топливо</span>
                <strong>
                  {vehicle.fuel}
                  <small>%</small>
                </strong>
                <Progress value={vehicle.fuel} label="Уровень топлива" />
              </div>
              <div>
                <Timer size={18} />
                <span>Наработка</span>
                <strong>
                  {vehicle.hours.toLocaleString("ru-RU")}
                  <small> м/ч</small>
                </strong>
              </div>
            </div>
            <p className={styles.capacity}>
              <Construction size={17} />
              {vehicle.capacity}
            </p>
            <h3>Закреплённый экипаж</h3>
            <div className={styles.driver}>
              <Avatar initials={vehicle.initials} size="large" />
              <div>
                <strong>{vehicle.driver}</strong>
                <p>Машинист / водитель · 08:00–20:00</p>
              </div>
              <ShieldCheck size={20} />
            </div>
            <h3>Задачи на смену</h3>
            {vehicleJobs.map((job) => (
              <div className={styles.job} key={job.id}>
                <header>
                  <span>№ {job.id}</span>
                  <span>
                    {formatTime(job.start)}–{formatTime(job.end)}
                  </span>
                </header>
                <h4>{job.title}</h4>
                <p>
                  <MapPin size={14} />
                  {job.location}
                </p>
              </div>
            ))}
            {vehicleJobs.length === 0 && (
              <div className={styles.detailEmpty}>
                {vehicle.status === "service"
                  ? "На время обслуживания выезды недоступны."
                  : "Задач пока нет. Техника готова к выезду."}
              </div>
            )}
            {vehicle.status === "ready" &&
              pending
                .filter((request) => request.category === vehicle.category)
                .map((request) => (
                  <button
                    key={request.id}
                    className={`${ui.primaryButton} ${ui.wide}`}
                    onClick={() => onAssign(request, vehicle.id)}
                  >
                    Назначить на заявку № {request.id}
                    <ArrowUpRight size={17} />
                  </button>
                ))}
            {vehicle.status === "service" && (
              <div className={styles.serviceBox}>
                <h3>Завершение обслуживания</h3>
                <p>После подтверждения выполненных работ техника станет доступна диспетчеру.</p>
                <button className={`${ui.primaryButton} ${ui.wide}`} onClick={() => onFinishService(vehicle)}>
                  <CheckCheck size={18} />
                  Работы выполнены, вернуть в парк
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </SidePanel>
  );
}
