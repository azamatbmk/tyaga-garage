"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, CheckCheck, Clock3, MapPin, Wrench, X } from "lucide-react";
import type { RequestItem } from "@/entities/request";
import type { Vehicle } from "@/entities/vehicle";
import { formatTime } from "@/shared/lib";
import { Avatar, Modal, SelectField, ui } from "@/shared/ui";
import styles from "@/shared/styles/overlays.module.css";

function normalizePlate(value: string) {
  return value.replace(/[\s·.\-]/g, "").toUpperCase();
}

export function AssignRequestDialog({
  request,
  fleet,
  vehicleId,
  onVehicleId,
  onClose,
  onConfirm,
}: {
  request: RequestItem;
  fleet: Vehicle[];
  vehicleId: string;
  onVehicleId: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const eligible = fleet.filter(
    (vehicle) =>
      vehicle.branchId === request.branchId &&
      vehicle.status === "ready" &&
      vehicle.category === request.category,
  );
  const selected = fleet.find((vehicle) => vehicle.id === vehicleId);
  const preferred = request.preferredVehicleId
    ? fleet.find((item) => item.id === request.preferredVehicleId)
    : undefined;
  const [plateQuery, setPlateQuery] = useState(
    () => selected?.plate ?? request.preferredPlate ?? "",
  );

  function onPlateInput(value: string) {
    setPlateQuery(value);
    const needle = normalizePlate(value);
    if (!needle) return;
    const exact = eligible.find((vehicle) => normalizePlate(vehicle.plate) === needle);
    if (exact) {
      onVehicleId(exact.id);
      return;
    }
    if (needle.length < 4) return;
    const prefix = eligible.find((vehicle) =>
      normalizePlate(vehicle.plate).startsWith(needle),
    );
    if (prefix) onVehicleId(prefix.id);
  }

  return (
    <Modal open onClose={onClose}>
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
        <p className={styles.description}>Заявка № {request.id}</p>
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
          {preferred && (
            <p className={ui.muted}>
              Запрошена машина: {preferred.plate} · {preferred.name}
            </p>
          )}
        </div>
        <label className={ui.formField}>
          Госномер
          <input
            value={plateQuery}
            onChange={(event) => onPlateInput(event.target.value)}
            placeholder="Введите или выберите номер"
            autoComplete="off"
          />
        </label>
        <SelectField
          label="Свободная техника"
          value={vehicleId}
          onChange={(id) => {
            onVehicleId(id);
            const next = eligible.find((item) => item.id === id);
            if (next) setPlateQuery(next.plate);
          }}
          options={eligible.map((vehicle) => ({
            value: vehicle.id,
            label: `${vehicle.plate} · ${vehicle.name}`,
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
          <button
            className={ui.primaryButton}
            disabled={!eligible.some((vehicle) => vehicle.id === vehicleId)}
            onClick={onConfirm}
          >
            Подтвердить назначение
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
