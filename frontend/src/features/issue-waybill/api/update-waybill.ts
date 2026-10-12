import type { GarageSnapshot } from "@/entities/garage";
import { apiRequest } from "@/shared/api";
import type { WaybillWriteBody } from "./create-waybill";

export function updateWaybill(
  id: string,
  body: Omit<WaybillWriteBody, "vehicleId"> & { vehicleId?: never },
) {
  return apiRequest<GarageSnapshot>(`/api/waybills/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
