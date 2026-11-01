import { CalendarClock } from "lucide-react";
import {
  DOCUMENT_HORIZON_DAYS,
  documentStatus,
  formatDocumentDate,
  type DocumentAlert,
} from "@/entities/garage";
import { ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";

export function DocumentsBoard({
  alerts,
  showBranch,
  onSelect,
}: {
  alerts: DocumentAlert[];
  showBranch: boolean;
  onSelect: (vehicleId: string) => void;
}) {
  return (
    <>
      <div className={styles.requestsToolbar}>
        <span className={ui.muted}>
          Просрочено и то, что истекает в ближайшие {DOCUMENT_HORIZON_DAYS} дней
        </span>
      </div>
      {alerts.length === 0 ? (
        <div className={`${styles.panel} ${ui.empty}`}>
          <CalendarClock size={36} />
          <h3>Сроки в порядке</h3>
          <p>Права, медосмотр и техосмотр не истекают в ближайшие {DOCUMENT_HORIZON_DAYS} дней.</p>
        </div>
      ) : (
        <div className={styles.simpleTableWrap}>
          <table className={styles.simpleTable}>
            <thead>
              <tr>
                <th>Документ</th>
                <th>Кто</th>
                {showBranch && <th>Филиал</th>}
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
                  <td>{alert.title}</td>
                  <td>
                    <strong>{alert.who}</strong>
                    <div className={ui.muted}>{alert.detail}</div>
                  </td>
                  {showBranch && <td>{alert.branchName}</td>}
                  <td className={ui.mono}>{formatDocumentDate(alert.expiresAt)}</td>
                  <td>{documentStatus(alert.days)}</td>
                  <td>
                    <button
                      type="button"
                      className={ui.secondaryButton}
                      aria-label={`Открыть карточку: ${alert.who}, ${alert.title}`}
                      onClick={() => onSelect(alert.vehicleId)}
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
    </>
  );
}
