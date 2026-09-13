import type { GarageSnapshot } from "@/entities/garage";
import { apiRequest } from "@/shared/api";

export function createRequest(body: {
  title: string;
  location: string;
  category: string;
  start: string;
  end: string;
  urgent: boolean;
}) {
  return apiRequest<GarageSnapshot>("/api/requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
