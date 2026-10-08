import { Table2 } from "lucide-react";
import type { Driver, TimesheetEntry } from "@/entities/garage";
import { ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";

const TYPE_LABEL = {
  overtime: "Сверхурочные",
  weekend: "Выходной",
} as const;

export function TimesheetBoard({
  entries,
  drivers,
}: {
  entries: TimesheetEntry[];
  drivers: Driver[];
}) {
  return (
    <>
      <div className={styles.requestsToolbar}>
        <span className={ui.muted}>Табель ГУП · сентябрь 2026 · ввод вручную от заявок</span>
      </div>
      {entries.length === 0 ? (
        <div className={`${styles.panel} ${ui.empty}`}>
          <Table2 size={36} />
          <h3>Записей в табеле нет</h3>
          <p>Сверхурочные и выходные вносятся диспетчером и уходят в табель ГУП.</p>
        </div>
      ) : (
        <div className={styles.simpleTableWrap}>
          <table className={styles.simpleTable}>
            <thead>
              <tr>
                <th>Водитель</th>
                <th>Тип</th>
                <th>Часы</th>
                <th>Заявка</th>
                <th>Примечание</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const driver = drivers.find((item) => item.id === entry.driverId);
                return (
                  <tr key={entry.id}>
                    <td>{driver?.fullName ?? entry.driverId}</td>
                    <td>{TYPE_LABEL[entry.type]}</td>
                    <td className={ui.mono}>{entry.hours}</td>
                    <td className={ui.mono}>{entry.requestId ? `№ ${entry.requestId}` : "—"}</td>
                    <td>{entry.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
