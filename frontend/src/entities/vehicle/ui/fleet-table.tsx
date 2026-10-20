import { ArrowUpRight } from "lucide-react";
import { Avatar, Progress, ui } from "@/shared/ui";
import type { Vehicle } from "../model";
import type { VehicleAssignment } from "../lib/assignment";
import { StatusBadge } from "./status-badge";
import { VehicleIcon } from "./vehicle-icon";
import styles from "@/shared/styles/panels.module.css";

export function FleetTable({
  vehicles,
  assignments,
  onSelect,
}: {
  vehicles: Vehicle[];
  assignments?: Record<string, VehicleAssignment | null | undefined>;
  onSelect: (id: string) => void;
}) {
  const showAssignment = Boolean(assignments);

  return (
    <table className={ui.table}>
      <thead>
        <tr>
          <th>Техника</th>
          <th>Статус</th>
          {showAssignment && <th>Куда назначена</th>}
          <th>Машинист / водитель</th>
          <th>Топливо</th>
          <th>Наработка</th>
          <th>
            <span className={ui.srOnly}>Подробнее</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => {
          const assignment = assignments?.[vehicle.id];
          return (
            <tr key={vehicle.id}>
              <td>
                <button className={styles.fleetName} onClick={() => onSelect(vehicle.id)}>
                  <VehicleIcon category={vehicle.category} status={vehicle.status} />
                  <span>
                    <strong>{vehicle.name}</strong>
                    <small>{vehicle.plate}</small>
                  </span>
                </button>
              </td>
              <td>
                <StatusBadge status={vehicle.status} />
              </td>
              {showAssignment && (
                <td>
                  {assignment ? (
                    <span>
                      <strong>{assignment.title}</strong>
                      <div className={ui.muted}>{assignment.location}</div>
                    </span>
                  ) : (
                    <span className={ui.muted}>—</span>
                  )}
                </td>
              )}
              <td>
                <span className={ui.driverCell}>
                  <Avatar initials={vehicle.initials} size="small" />
                  {vehicle.driver}
                </span>
              </td>
              <td>
                <div className={styles.fuel}>
                  <span>{vehicle.fuel}%</span>
                  <Progress value={vehicle.fuel} label={`Топливо ${vehicle.fuel}%`} />
                </div>
              </td>
              <td className={ui.mono}>{vehicle.hours.toLocaleString("ru-RU")} м/ч</td>
              <td>
                <button
                  className={ui.iconButton}
                  onClick={() => onSelect(vehicle.id)}
                  aria-label={`Карточка ${vehicle.name}`}
                >
                  <ArrowUpRight size={18} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
