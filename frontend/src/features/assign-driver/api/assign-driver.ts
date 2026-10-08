import type { GarageSnapshot } from "@/entities/garage";
import { apiRequest } from "@/shared/api";

export function assignDriver(vehicleId: string, driverId: string) {
  return apiRequest<GarageSnapshot>(`/api/fleet/${vehicleId}/assign-driver`, {
    method: "POST",
    body: JSON.stringify({ driverId }),
  });
}
