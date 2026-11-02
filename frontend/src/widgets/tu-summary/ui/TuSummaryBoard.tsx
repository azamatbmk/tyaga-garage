import { CalendarClock, ClipboardList, Wrench } from "lucide-react";
import {
  documentStatus,
  formatDocumentDate,
  type Branch,
  type DocumentAlert,
} from "@/entities/garage";
import type { RequestItem } from "@/entities/request";
import type { Vehicle } from "@/entities/vehicle";
import { formatTime } from "@/shared/lib";
import { ui } from "@/shared/ui";
import panels from "@/shared/styles/panels.module.css";
import styles from "./tu-summary.module.css";

export function TuSummaryBoard({
  requests,
  fleet,
  branches,
  alerts,
  onOpenRequest,
  onSelectVehicle,
}: {
  requests: RequestItem[];
  fleet: Vehicle[];
  branches: Branch[];
  alerts: DocumentAlert[];
  onOpenRequest: (request: RequestItem) => void;
  onSelectVehicle: (vehicleId: string) => void;
}) {
  const branchName = new Map(branches.map((item) => [item.id, item.name]));
  const nameOf = (branchId: string) => branchName.get(branchId) ?? branchId;
  const queue = requests
    .filter((item) => !item.assigned)
    .sort((left, right) => Number(right.urgent) - Number(left.urgent) || left.id - right.id);
  const downtime = fleet
    .filter((item) => item.status === "service")
    .sort(
      (left, right) =>
        nameOf(left.branchId).localeCompare(nameOf(right.branchId), "ru") ||
        left.name.localeCompare(right.name, "ru"),
    );

  return (
    <div className={styles.stack}>
      <section className={styles.block} aria-labelledby="summary-queue">
        <h2 id="summary-queue">Очередь · {queue.length}</h2>
        {queue.length === 0 ? (
          <div className={`${panels.panel} ${ui.empty}`}>
            <ClipboardList size={32} />
            <h3>Очередь пуста</h3>
            <p>Нет заявок, которые ждут технику.</p>
          </div>
        ) : (
          <div className={panels.simpleTableWrap}>
            <table className={panels.simpleTable}>
              <thead>
                <tr>
                  <th>Заявка</th>
                  <th>Филиал</th>
                  <th>Время</th>
                  <th>
                    <span className={ui.srOnly}>Назначить</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {queue.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>
                        № {request.id} · {request.title}
                      </strong>
                      <div className={ui.muted}>
                        {request.location}
                        {request.urgent ? " · приоритетная" : ""}
                      </div>
                    </td>
                    <td>{nameOf(request.branchId)}</td>
                    <td className={ui.mono}>
                      {formatTime(request.start)}–{formatTime(request.end)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={ui.secondaryButton}
                        aria-label={`Назначить технику на заявку ${request.id}`}
                        onClick={() => onOpenRequest(request)}
                      >
                        Назначить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.block} aria-labelledby="summary-down">
        <h2 id="summary-down">Простой · {downtime.length}</h2>
        {downtime.length === 0 ? (
          <div className={`${panels.panel} ${ui.empty}`}>
            <Wrench size={32} />
            <h3>Вся техника в строю</h3>
            <p>Нет машин на обслуживании.</p>
          </div>
        ) : (
          <div className={panels.simpleTableWrap}>
            <table className={panels.simpleTable}>
              <thead>
                <tr>
                  <th>Техника</th>
                  <th>Филиал</th>
                  <th>Водитель</th>
                  <th>
                    <span className={ui.srOnly}>Карточка</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {downtime.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <strong>{vehicle.name}</strong>
                      <div className={ui.muted}>
                        {vehicle.plate} · {vehicle.category}
                      </div>
                    </td>
                    <td>{nameOf(vehicle.branchId)}</td>
                    <td>{vehicle.driver}</td>
                    <td>
                      <button
                        type="button"
                        className={ui.secondaryButton}
                        aria-label={`Открыть карточку ${vehicle.name}`}
                        onClick={() => onSelectVehicle(vehicle.id)}
                      >
                        Карточка
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.block} aria-labelledby="summary-docs">
        <h2 id="summary-docs">Сроки · {alerts.length}</h2>
        {alerts.length === 0 ? (
          <div className={`${panels.panel} ${ui.empty}`}>
            <CalendarClock size={32} />
            <h3>Сроки в порядке</h3>
            <p>Нет просроченных документов и тех, что истекают в ближайшие 30 дней.</p>
          </div>
        ) : (
          <div className={panels.simpleTableWrap}>
            <table className={panels.simpleTable}>
              <thead>
                <tr>
                  <th>Документ</th>
                  <th>Филиал</th>
                  <th>До</th>
                  <th>Статус</th>
                  <th>
                    <span className={ui.srOnly}>Карточка</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <strong>
                        {alert.title} · {alert.who}
                      </strong>
                      <div className={ui.muted}>{alert.detail}</div>
                    </td>
                    <td>{alert.branchName}</td>
                    <td className={ui.mono}>{formatDocumentDate(alert.expiresAt)}</td>
                    <td>{documentStatus(alert.days)}</td>
                    <td>
                      <button
                        type="button"
                        className={ui.secondaryButton}
                        aria-label={`Открыть карточку: ${alert.who}, ${alert.title}`}
                        onClick={() => onSelectVehicle(alert.vehicleId)}
                      >
                        Карточка
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
