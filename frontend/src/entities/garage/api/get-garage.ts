import { apiRequest } from "@/shared/api";
import type { GarageSnapshot } from "../model/types";

export function getGarage() {
  return apiRequest<GarageSnapshot>("/api/garage");
}
