"use client";

import { useState } from "react";
import { useGarage, type Waybill } from "@/entities/garage";
import { useToast } from "@/shared/ui";
import { createWaybill } from "../api/create-waybill";
import { updateWaybill } from "../api/update-waybill";
import type { WaybillFormValues } from "./types";

export function useIssueWaybill() {
  const { setSnapshot } = useGarage();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Waybill | null>(null);

  function startCreate() {
    setMode("create");
    setEditing(null);
    setOpen(true);
  }

  function startEdit(waybill: Waybill) {
    setMode("edit");
    setEditing(waybill);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditing(null);
  }

  async function submit(values: WaybillFormValues) {
    const odometerStart = Number(values.odometerStart);
    const odometerEndRaw = values.odometerEnd.trim();
    const odometerEnd = odometerEndRaw === "" ? null : Number(odometerEndRaw);

    if (!Number.isInteger(odometerStart) || odometerStart < 0) {
      showToast({ kind: "error", title: "Укажите целое число километража при выпуске" });
      return;
    }
    if (odometerEnd != null && (!Number.isInteger(odometerEnd) || odometerEnd < 0)) {
      showToast({ kind: "error", title: "Километраж при возврате должен быть целым числом" });
      return;
    }

    try {
      const next =
        mode === "create"
          ? await createWaybill({
              vehicleId: values.vehicleId,
              validFrom: values.validFrom,
              validTo: values.validTo,
              odometerStart,
              odometerEnd,
              messageKind: values.messageKind,
            })
          : await updateWaybill(editing!.id, {
              validFrom: values.validFrom,
              validTo: values.validTo,
              odometerStart,
              odometerEnd,
              messageKind: values.messageKind,
            });
      setSnapshot(next);
      close();
      showToast({
        kind: "success",
        title: mode === "create" ? "Путевой выдан" : "Путевой обновлён",
      });
    } catch (err) {
      showToast({
        kind: "error",
        title: err instanceof Error ? err.message : "Не удалось сохранить путевой",
      });
    }
  }

  return { open, mode, editing, startCreate, startEdit, close, submit };
}
