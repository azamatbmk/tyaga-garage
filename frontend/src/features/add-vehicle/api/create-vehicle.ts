import type { GarageSnapshot } from "@/entities/garage";
import { apiRequest } from "@/shared/api";

export type CreateVehicleBody = {
  name: string;
  category: string;
  plate: string;
  branchId: string;
  capacity?: string;
  driverId?: string;
  driverName?: string;
  fuel?: number;
  hours?: number;
};

export function createVehicle(body: CreateVehicleBody) {
  return apiRequest<GarageSnapshot>("/api/fleet", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
