"use client";

import { type FormEvent, useState } from "react";
import { FileText, X } from "lucide-react";
import type { Waybill } from "@/entities/garage";
import type { Vehicle } from "@/entities/vehicle";
import { Modal, SelectField, ui } from "@/shared/ui";
import styles from "@/shared/styles/overlays.module.css";
import type { WaybillFormValues } from "../model/types";

const MESSAGE_KINDS = [
  { value: "городское", label: "Городское" },
  { value: "пригородное", label: "Пригородное" },
  { value: "междугородное", label: "Междугородное" },
] as const;

function emptyValues(vehicleId = ""): WaybillFormValues {
  return {
    vehicleId,
    validFrom: "2026-09-12",
    validTo: "2026-09-18",
    odometerStart: "",
    odometerEnd: "",
    messageKind: "городское",
  };
}

function fromWaybill(waybill: Waybill): WaybillFormValues {
  return {
    vehicleId: waybill.vehicleId,
    validFrom: waybill.validFrom,
    validTo: waybill.validTo,
    odometerStart: String(waybill.odometerStart),
    odometerEnd: waybill.odometerEnd != null ? String(waybill.odometerEnd) : "",
    messageKind: waybill.messageKind,
  };
}

function initialValues(
  mode: "create" | "edit",
  waybill: Waybill | null,
  fleet: Vehicle[],
): WaybillFormValues {
  if (mode === "edit" && waybill) return fromWaybill(waybill);
  return emptyValues(fleet[0]?.id ?? "");
}

export function WaybillFormDialog({
  open,
  mode,
  fleet,
  waybill,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  fleet: Vehicle[];
  waybill: Waybill | null;
  onClose: () => void;
  onSubmit: (values: WaybillFormValues) => void;
}) {
  const [values, setValues] = useState(() => initialValues(mode, waybill, fleet));
  const selected = fleet.find((item) => item.id === values.vehicleId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.dialog} role="dialog" aria-labelledby="waybill-form-title">
        <div className={styles.kicker}>
          <span className={styles.dialogIcon}>
            <FileText size={23} />
          </span>
          <button className={ui.iconButton} aria-label="Закрыть форму путевого" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <h2 id="waybill-form-title">{mode === "create" ? "Выдать путевой" : "Изменить путевой"}</h2>
        <p className={styles.description}>
          Срок действия — любой период. Начальный километраж вводится вручную (приказ № 390).
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "create" ? (
            <SelectField
              label="Машина"
              value={values.vehicleId}
              onChange={(vehicleId) => setValues((prev) => ({ ...prev, vehicleId }))}
              options={fleet.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.plate} · ${item.driver}`,
              }))}
            />
          ) : (
            <p className={styles.description}>
              {waybill?.vehicleBrandModel} · {waybill?.vehiclePlate} · {waybill?.driverName}
            </p>
          )}

          {selected && mode === "create" && (
            <p className={ui.muted}>Водитель по закреплению: {selected.driver}</p>
          )}

          <div className={styles.formRow}>
            <label className={ui.formField}>
              Срок с
              <input
                required
                type="date"
                value={values.validFrom}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, validFrom: event.target.value }))
                }
              />
            </label>
            <label className={ui.formField}>
              Срок по
              <input
                required
                type="date"
                value={values.validTo}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, validTo: event.target.value }))
                }
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={ui.formField}>
              Километраж при выпуске, км
              <input
                required
                type="number"
                min={0}
                step={1}
                name="odometerStart"
                value={values.odometerStart}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, odometerStart: event.target.value }))
                }
                placeholder="Например, 124580"
              />
            </label>
            <label className={ui.formField}>
              Километраж при возврате, км
              <input
                type="number"
                min={0}
                step={1}
                name="odometerEnd"
                value={values.odometerEnd}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, odometerEnd: event.target.value }))
                }
                placeholder="Необязательно"
              />
            </label>
          </div>

          <SelectField
            label="Вид сообщения"
            value={values.messageKind}
            onChange={(messageKind) =>
              setValues((prev) => ({
                ...prev,
                messageKind: messageKind as WaybillFormValues["messageKind"],
              }))
            }
            options={[...MESSAGE_KINDS]}
          />

          <button className={`${ui.primaryButton} ${ui.wide}`} type="submit">
            <FileText size={18} />
            {mode === "create" ? "Выдать путевой" : "Сохранить"}
          </button>
        </form>
      </div>
    </Modal>
  );
}
