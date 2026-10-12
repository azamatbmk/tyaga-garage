"use client";

import { useRef, useState } from "react";
import { useGarage } from "@/entities/garage";
import { REQUEST_CATEGORIES } from "@/entities/vehicle";
import { useRole } from "@/shared/model/role-store";
import { useToast } from "@/shared/ui";
import { createVehicle } from "../api/create-vehicle";
import { scanPassportImage } from "./scan-passport";
import type { VehicleFormValues } from "./types";

function emptyValues(branchId: string): VehicleFormValues {
  return {
    name: "",
    category: REQUEST_CATEGORIES[0],
    plate: "",
    branchId,
    capacity: "",
    driverId: "",
    driverName: "",
  };
}

export function useAddVehicle() {
  const { snapshot, setSnapshot } = useGarage();
  const { persona } = useRole();
  const { showToast } = useToast();
  const defaultBranch = persona.branchId ?? snapshot?.branches[0]?.id ?? "b-vlad";
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<VehicleFormValues>(() => emptyValues(defaultBranch));
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  function start() {
    abortRef.current?.abort();
    abortRef.current = null;
    setValues(emptyValues(persona.branchId ?? snapshot?.branches[0]?.id ?? "b-vlad"));
    setScanStatus("");
    setScanning(false);
    setOpen(true);
  }

  function close() {
    abortRef.current?.abort();
    abortRef.current = null;
    setOpen(false);
    setScanning(false);
    setScanStatus("");
  }

  function patch(partial: Partial<VehicleFormValues>) {
    setValues((prev) => ({ ...prev, ...partial }));
  }

  async function scanFile(file: File) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setScanning(true);
    setScanStatus("Готовим скан…");
    try {
      const draft = await scanPassportImage(file, setScanStatus, controller.signal);
      setValues((prev) => ({
        ...prev,
        name: draft.name ?? prev.name,
        plate: draft.plate ?? prev.plate,
        category: draft.category ?? prev.category,
        capacity: draft.capacity ?? prev.capacity,
      }));
      const found = [draft.plate, draft.name, draft.category].filter(Boolean).length;
      if (found === 0) {
        showToast({
          kind: "error",
          title: "Не удалось прочитать поля",
          description: "Проверьте свет и резкость, или заполните форму вручную.",
        });
      } else {
        showToast({
          kind: "success",
          title: "Данные с паспорта подставлены",
          description: "Проверьте поля перед сохранением.",
        });
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        showToast({
          kind: "error",
          title: err instanceof Error ? err.message : "Ошибка сканирования",
        });
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setScanning(false);
      setScanStatus("");
    }
  }

  async function submit(next: VehicleFormValues) {
    if (!next.name.trim() || !next.plate.trim()) {
      showToast({ kind: "error", title: "Укажите марку/модель и госномер" });
      return;
    }
    try {
      const snapshotNext = await createVehicle({
        name: next.name.trim(),
        category: next.category,
        plate: next.plate.trim(),
        branchId: next.branchId,
        capacity: next.capacity.trim() || undefined,
        driverId: next.driverId || undefined,
        driverName: next.driverName.trim() || undefined,
      });
      setSnapshot(snapshotNext);
      close();
      showToast({ kind: "success", title: `${next.name} добавлена в парк` });
    } catch (err) {
      showToast({
        kind: "error",
        title: err instanceof Error ? err.message : "Не удалось добавить технику",
      });
    }
  }

  const branchDriverIds = new Set(
    (snapshot?.fleet ?? [])
      .filter((item) => item.branchId === values.branchId)
      .map((item) => item.driverId),
  );
  const drivers = (snapshot?.drivers ?? []).filter(
    (driver) => branchDriverIds.has(driver.id) || driver.id === "d-unassigned",
  );

  return {
    open,
    values,
    setValues: patch,
    scanning,
    scanStatus,
    branches: snapshot?.branches ?? [],
    drivers,
    start,
    close,
    scanFile,
    submit,
  };
}
