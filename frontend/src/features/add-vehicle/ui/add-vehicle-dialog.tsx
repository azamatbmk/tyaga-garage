"use client";

import { type ChangeEvent, type FormEvent, useRef } from "react";
import { Camera, Plus, ScanLine, X } from "lucide-react";
import type { Branch, Driver } from "@/entities/garage";
import { REQUEST_CATEGORIES } from "@/entities/vehicle";
import { Modal, SelectField, ui } from "@/shared/ui";
import styles from "@/shared/styles/overlays.module.css";
import type { VehicleFormValues } from "../model/types";

export function AddVehicleDialog({
  open,
  values,
  branches,
  drivers,
  scanning,
  scanStatus,
  lockBranch,
  onChange,
  onClose,
  onScanFile,
  onSubmit,
}: {
  open: boolean;
  values: VehicleFormValues;
  branches: Branch[];
  drivers: Driver[];
  scanning: boolean;
  scanStatus: string;
  lockBranch?: boolean;
  onChange: (partial: Partial<VehicleFormValues>) => void;
  onClose: () => void;
  onScanFile: (file: File) => void;
  onSubmit: (values: VehicleFormValues) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onScanFile(file);
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.dialog} role="dialog" aria-labelledby="add-vehicle-title">
        <div className={styles.kicker}>
          <span className={styles.dialogIcon}>
            <Plus size={23} />
          </span>
          <button className={ui.iconButton} aria-label="Закрыть добавление техники" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <h2 id="add-vehicle-title">Добавить технику</h2>
        <p className={styles.description}>
          Вручную или со скана ПТС/СТС: фото паспорта подставит госномер, марку и тип.
        </p>

        <div className={styles.formRow}>
          <button
            type="button"
            className={ui.secondaryButton}
            disabled={scanning}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera size={18} />
            Сфотографировать паспорт
          </button>
          <button
            type="button"
            className={ui.secondaryButton}
            disabled={scanning}
            onClick={() => galleryRef.current?.click()}
          >
            <ScanLine size={18} />
            Загрузить скан
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={ui.srOnly}
          aria-label="Сфотографировать техпаспорт"
          onChange={handleFile}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className={ui.srOnly}
          aria-label="Загрузить скан техпаспорта"
          onChange={handleFile}
        />
        {scanning && (
          <p className={ui.muted}>
            {scanStatus || "Сканируем…"} · закройте окно, чтобы отменить
          </p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {!lockBranch && (
            <SelectField
              label="Филиал"
              value={values.branchId}
              onChange={(branchId) => onChange({ branchId, driverId: "" })}
              options={branches.map((item) => ({ value: item.id, label: item.name }))}
            />
          )}
          <label className={ui.formField}>
            Марка и модель
            <input
              required
              maxLength={80}
              value={values.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Например, JCB 3CX"
            />
          </label>
          <label className={ui.formField}>
            Госномер
            <input
              required
              maxLength={40}
              value={values.plate}
              onChange={(event) => onChange({ plate: event.target.value })}
              placeholder="А 123 АА · 15"
            />
          </label>
          <SelectField
            label="Тип техники"
            value={values.category}
            onChange={(category) => onChange({ category })}
            options={REQUEST_CATEGORIES.map((item) => ({ value: item, label: item }))}
          />
          <label className={ui.formField}>
            Характеристика (ковш, грузоподъёмность)
            <input
              maxLength={80}
              value={values.capacity}
              onChange={(event) => onChange({ capacity: event.target.value })}
              placeholder="Ковш 1,0 м³"
            />
          </label>
          {drivers.length > 0 && (
            <SelectField
              label="Водитель (из списка)"
              value={values.driverId}
              onChange={(driverId) => onChange({ driverId, driverName: "" })}
              options={[
                { value: "", label: "Не выбран" },
                ...drivers.map((item) => ({
                  value: item.id,
                  label: `${item.fullName} · кат. ${item.licenseCategory}`,
                })),
              ]}
            />
          )}
          <label className={ui.formField}>
            Или ФИО нового водителя
            <input
              maxLength={80}
              value={values.driverName}
              disabled={!!values.driverId}
              onChange={(event) => onChange({ driverName: event.target.value })}
              placeholder="Если оставить пустым — «Не назначен»"
            />
          </label>
          <button className={`${ui.primaryButton} ${ui.wide}`} type="submit" disabled={scanning}>
            <Plus size={18} />
            Сохранить в парк
          </button>
        </form>
      </div>
    </Modal>
  );
}
