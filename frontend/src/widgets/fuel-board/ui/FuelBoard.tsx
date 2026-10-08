import { Fuel } from "lucide-react";
import type { Fueling } from "@/entities/garage";
import type { Vehicle } from "@/entities/vehicle";
import { ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";

const SOURCE_LABEL = {
  cheque: "Чек",
  program: "Топливная программа",
} as const;

export function FuelBoard({ fuelings, fleet }: { fuelings: Fueling[]; fleet: Vehicle[] }) {
  const totalLiters = fuelings.reduce((sum, item) => sum + item.liters, 0);

  return (
    <>
      <div className={styles.requestsToolbar}>
        <span className={ui.muted}>
          Сентябрь 2026 · всего {totalLiters.toLocaleString("ru-RU")} л · отчёт за месяц
        </span>
      </div>
      {fuelings.length === 0 ? (
        <div className={`${styles.panel} ${ui.empty}`}>
          <Fuel size={36} />
          <h3>Заправок пока нет</h3>
          <p>Учитываются чеки с АЗС и транзакции топливной программы по машине.</p>
        </div>
      ) : (
        <div className={styles.simpleTableWrap}>
          <table className={styles.simpleTable}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Машина</th>
                <th>Литры</th>
                <th>Источник</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {fuelings.map((item) => {
                const vehicle = fleet.find((vehicle) => vehicle.id === item.vehicleId);
                return (
                  <tr key={item.id}>
                    <td>{item.fueledAt}</td>
                    <td>
                      <strong>{vehicle?.name ?? item.vehicleId}</strong>
                      <div className={ui.muted}>{vehicle?.plate}</div>
                    </td>
                    <td className={ui.mono}>{item.liters}</td>
                    <td>{SOURCE_LABEL[item.source]}</td>
                    <td className={ui.mono}>
                      {item.amount != null ? `${item.amount.toLocaleString("ru-RU")} ₽` : "—"}
                    </td>
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
