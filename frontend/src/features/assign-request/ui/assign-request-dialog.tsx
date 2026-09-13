import { ArrowRight, ArrowUpRight, CheckCheck, Clock3, MapPin, Wrench, X } from "lucide-react";
import type { RequestItem } from "@/entities/request";
import type { Vehicle } from "@/entities/vehicle";
import { formatTime } from "@/shared/lib";
import { Avatar, Modal, SelectField, ui } from "@/shared/ui";
import styles from "@/shared/styles/overlays.module.css";

export function AssignRequestDialog({
  request,
  fleet,
  vehicleId,
  onVehicleId,
  onClose,
  onConfirm,
}: {
  request: RequestItem | null;
  fleet: Vehicle[];
  vehicleId: string;
  onVehicleId: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const eligible = request
    ? fleet.filter((vehicle) => vehicle.status === "ready" && vehicle.category === request.category)
    : [];
  const selected = fleet.find((vehicle) => vehicle.id === vehicleId);

  return (
    <Modal open={!!request} onClose={onClose}>
      {request && (
        <div className={styles.dialog} role="dialog" aria-labelledby="assign-title">
          <div className={styles.kicker}>
            <span className={styles.dialogIcon}>
              <ArrowUpRight size={23} />
            </span>
            <button className={ui.iconButton} aria-label="Закрыть назначение" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <h2 id="assign-title">Назначить технику</h2>
          <p className={styles.description}>Заявка № {request.id} · 12 сентября</p>
          <div className={styles.brief}>
            <h3>{request.title}</h3>
            <p>
              <MapPin size={15} />
              {request.location}
            </p>
            <span>
              <Clock3 size={15} />
              {formatTime(request.start)}–{formatTime(request.end)} · {request.category}
            </span>
          </div>
          <SelectField
            label="Свободная техника"
            value={vehicleId}
            onChange={onVehicleId}
            options={eligible.map((vehicle) => ({
              value: vehicle.id,
              label: `${vehicle.name} · ${vehicle.plate}`,
            }))}
          />
          {eligible.length === 0 ? (
            <div className={styles.notice}>
              <Wrench size={20} />
              <p>Свободной техники этого типа нет. Заявка останется в очереди до освобождения машины.</p>
            </div>
          ) : (
            selected && (
              <div className={styles.driver}>
                <Avatar initials={selected.initials} />
                <div>
                  <small>ЗАКРЕПЛЁННЫЙ ВОДИТЕЛЬ</small>
                  <strong>{selected.driver}</strong>
                </div>
                <CheckCheck size={20} />
              </div>
            )
          )}
          <div className={styles.actions}>
            <button className={ui.secondaryButton} onClick={onClose}>
              Отмена
            </button>
            <button className={ui.primaryButton} disabled={!eligible.length || !vehicleId} onClick={onConfirm}>
              Подтвердить назначение
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
