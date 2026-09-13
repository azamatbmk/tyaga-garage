"use client";

import { useGarage } from "@/entities/garage";
import type { Vehicle } from "@/entities/vehicle";
import { useToast } from "@/shared/ui";
import { finishService } from "../api/finish-service";

export function useFinishService() {
  const { setSnapshot } = useGarage();
  const { showToast } = useToast();

  async function complete(vehicle: Vehicle) {
    try {
      const next = await finishService(vehicle.id);
      setSnapshot(next);
      showToast({ kind: "success", title: `${vehicle.name} готова к выезду` });
    } catch (err) {
      showToast({ kind: "error", title: err instanceof Error ? err.message : "Ошибка обслуживания" });
    }
  }

  return { complete };
}
