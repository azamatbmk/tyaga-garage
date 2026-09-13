import type { GarageSnapshot } from "@/entities/garage";
import { apiRequest } from "@/shared/api";

export function assignRequest(id: number, vehicleId: string) {
  return apiRequest<GarageSnapshot>(`/api/requests/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ vehicleId }),
  });
}
