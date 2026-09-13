import type { GarageSnapshot } from "@/entities/garage";
import { apiRequest } from "@/shared/api";

export function finishService(vehicleId: string) {
  return apiRequest<GarageSnapshot>(`/api/fleet/${vehicleId}/finish-service`, {
    method: "POST",
  });
}
