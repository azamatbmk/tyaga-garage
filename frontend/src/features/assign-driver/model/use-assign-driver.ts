"use client";

import { useGarage } from "@/entities/garage";
import { useToast } from "@/shared/ui";
import { assignDriver } from "../api/assign-driver";

export function useAssignDriver() {
  const { snapshot, setSnapshot } = useGarage();
  const { showToast } = useToast();

  async function changeDriver(vehicleId: string, driverId: string) {
    const current = snapshot?.fleet.find((vehicle) => vehicle.id === vehicleId);
    if (current?.driverId === driverId) {
      return true;
    }

    try {
      const next = await assignDriver(vehicleId, driverId);
      setSnapshot(next);
      showToast({ kind: "success", title: "Водитель закреплён за машиной" });
      return true;
    } catch (err) {
      showToast({
        kind: "error",
        title: err instanceof Error ? err.message : "Не удалось сменить водителя",
      });
      return false;
    }
  }

  return { changeDriver };
}
