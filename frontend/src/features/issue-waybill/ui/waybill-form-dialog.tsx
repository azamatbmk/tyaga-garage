"use client";

import { type FormEvent, useState } from "react";
import { FileText, X } from "lucide-react";
import type { Waybill } from "@/entities/garage";
import type { RequestItem } from "@/entities/request";
import type { Vehicle } from "@/entities/vehicle";
import { Modal, SelectField, ui } from "@/shared/ui";
import styles from "@/shared/styles/overlays.module.css";
import type { WaybillFormValues } from "../model/types";

const MESSAGE_KINDS = [
  { value: "городское", label: "Городское" },
  { value: "пригородное", label: "Пригородное" },
  { value: "междугородное", label: "Междугородное" },
] as const;

function emptyValues(requestId = 0): WaybillFormValues {
  return {
    requestId,
    validFrom: "2026-09-12",
    validTo: "2026-09-18",
    odometerStart: "",
    odometerEnd: "",
    messageKind: "городское",
  };
}

function fromWaybill(waybill: Waybill): WaybillFormValues {
  return {
    requestId: waybill.requestId ?? 0,
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
  requestId: number,
): WaybillFormValues {
  if (mode === "edit" && waybill) return fromWaybill(waybill);
  return emptyValues(requestId);
}

export function WaybillFormDialog({
  open,
  mode,
  requests,
  fleet,
  requestId,
  waybill,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  requests: RequestItem[];
  fleet: Vehicle[];
  requestId: number | null;
  waybill: Waybill | null;
  onClose: () => void;
  onSubmit: (values: WaybillFormValues) => void;
}) {
  const [values, setValues] = useState(() =>
    initialValues(mode, waybill, requestId ?? requests[0]?.id ?? 0),
  );
  const request = requests.find((item) => item.id === values.requestId);
  const vehicle = fleet.find((item) => item.id === request?.assigned);

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
          Лист выпускается только из назначенной заявки. Машина и водитель остаются на листе,
          даже если потом закрепление сменят. Права, медосмотр и техосмотр должны покрывать весь срок.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "create" ? (
            requests.length > 0 ? (
              <SelectField
                label="Заявка"
                value={String(values.requestId)}
                onChange={(next) =>
                  setValues((prev) => ({ ...prev, requestId: Number(next) }))
                }
                options={requests.map((item) => ({
                  value: String(item.id),
                  label: `№ ${item.id} · ${item.title}`,
                }))}
              />
            ) : (
              <p className={styles.description}>Нет назначенных заявок без путевого.</p>
            )
          ) : (
            <p className={styles.description}>
              № {waybill?.number}
              {waybill?.requestId ? ` · заявка ${waybill.requestId}` : ""}
              {waybill?.requestTitle ? ` · ${waybill.requestTitle}` : ""}
              <br />
              {waybill?.vehicleBrandModel} · {waybill?.vehiclePlate} · {waybill?.driverName}
            </p>
          )}

          {mode === "create" && vehicle && (
            <p className={ui.muted}>
              {vehicle.name} · {vehicle.plate} · водитель {vehicle.driver}
            </p>
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

          <button
            className={`${ui.primaryButton} ${ui.wide}`}
            type="submit"
            disabled={mode === "create" && !vehicle}
          >
            <FileText size={18} />
            {mode === "create" ? "Выдать путевой" : "Сохранить"}
          </button>
        </form>
      </div>
    </Modal>
  );
}
