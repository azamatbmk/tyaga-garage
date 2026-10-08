import { FileText, Printer } from "lucide-react";
import type { Driver, Waybill } from "@/entities/garage";
import type { Vehicle } from "@/entities/vehicle";
import { ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";

export function WaybillsBoard({
  waybills,
  fleet,
  drivers,
  onPrint,
}: {
  waybills: Waybill[];
  fleet: Vehicle[];
  drivers: Driver[];
  onPrint: (waybill: Waybill, vehicle?: Vehicle) => void;
}) {
  return (
    <>
      <div className={styles.requestsToolbar}>
        <span className={ui.muted}>Неделя с 08.09.2026 · путевой на машину · печать по строке</span>
      </div>
      {waybills.length === 0 ? (
        <div className={`${styles.panel} ${ui.empty}`}>
          <FileText size={36} />
          <h3>Путевых пока нет</h3>
          <p>Диспетчер выдаёт путевой лист раз в неделю на каждую машину.</p>
        </div>
      ) : (
        <div className={styles.simpleTableWrap}>
          <table className={styles.simpleTable}>
            <thead>
              <tr>
                <th>Машина</th>
                <th>Водитель</th>
                <th>Категория прав</th>
                <th>Начало недели</th>
                <th>Начальный км</th>
                <th>Печать</th>
              </tr>
            </thead>
            <tbody>
              {waybills.map((waybill) => {
                const vehicle = fleet.find((item) => item.id === waybill.vehicleId);
                const driver = drivers.find((item) => item.id === waybill.driverId);
                return (
                  <tr key={waybill.id}>
                    <td>
                      <strong>{vehicle?.name ?? waybill.vehicleId}</strong>
                      <div className={ui.muted}>{vehicle?.plate}</div>
                    </td>
                    <td>{driver?.fullName ?? waybill.driverName}</td>
                    <td>{waybill.licenseCategory}</td>
                    <td>{waybill.weekStart}</td>
                    <td className={ui.mono}>{waybill.odometerStart.toLocaleString("ru-RU")}</td>
                    <td>
                      <button
                        type="button"
                        className={ui.secondaryButton}
                        aria-label={`Распечатать путевой для ${vehicle?.name ?? waybill.vehicleId}`}
                        onClick={() => onPrint(waybill, vehicle)}
                      >
                        <Printer size={16} />
                        Печать
                      </button>
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
