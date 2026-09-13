"use client";

import { useState } from "react";
import { useGarage } from "@/entities/garage";
import type { RequestItem } from "@/entities/request";
import { formatTime } from "@/shared/lib";
import { useToast } from "@/shared/ui";
import { assignRequest } from "../api/assign-request";

export function useAssignRequest() {
  const { snapshot, setSnapshot } = useGarage();
  const { showToast } = useToast();
  const [request, setRequest] = useState<RequestItem | null>(null);
  const [vehicleId, setVehicleId] = useState("");

  function start(next: RequestItem, preferred?: string) {
    if (!snapshot) return;
    setRequest(next);
    setVehicleId(
      preferred ||
        snapshot.fleet.find((vehicle) => vehicle.status === "ready" && vehicle.category === next.category)?.id ||
        "",
    );
  }

  function close() {
    setRequest(null);
  }

  async function confirm() {
    if (!request) return;
    try {
      const next = await assignRequest(request.id, vehicleId);
      const vehicle = next.fleet.find((item) => item.id === vehicleId);
      setSnapshot(next);
      close();
      showToast({
        kind: "success",
        title: `${vehicle?.name} и ${vehicle?.driver} назначены`,
        description: `${request.title} · ${formatTime(request.start)}–${formatTime(request.end)}`,
      });
      return true;
    } catch (err) {
      showToast({ kind: "error", title: err instanceof Error ? err.message : "Ошибка назначения" });
      return false;
    }
  }

  return { request, vehicleId, setVehicleId, start, close, confirm };
}
