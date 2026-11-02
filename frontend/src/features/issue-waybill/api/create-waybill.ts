import type { GarageSnapshot } from "@/entities/garage";
import { apiRequest } from "@/shared/api";

export type WaybillWriteBody = {
  requestId: number;
  validFrom: string;
  validTo: string;
  odometerStart: number;
  odometerEnd?: number | null;
  messageKind?: "городское" | "пригородное" | "междугородное";
};

export function createWaybill(body: WaybillWriteBody) {
  return apiRequest<GarageSnapshot>("/api/waybills", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
