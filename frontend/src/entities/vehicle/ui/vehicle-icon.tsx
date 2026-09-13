import { Construction, Tractor, Truck } from "lucide-react";
import { cx } from "@/shared/lib";
import { ui } from "@/shared/ui";
import type { Status } from "../model";

const iconByStatus = {
  working: ui.vehicleWorking,
  ready: undefined,
  reserved: ui.vehicleReserved,
  service: ui.vehicleService,
};

export function VehicleIcon({
  category,
  status,
  size = 24,
  framed = true,
}: {
  category: string;
  status?: Status;
  size?: number;
  framed?: boolean;
}) {
  const Icon =
    category === "Самосвал"
      ? Truck
      : category.includes("погрузчик") || category === "Бульдозер"
        ? Tractor
        : Construction;
  const icon = <Icon size={size} strokeWidth={1.5} />;
  if (!framed) return icon;

  return <span className={cx(ui.vehicleIcon, status && iconByStatus[status])}>{icon}</span>;
}
