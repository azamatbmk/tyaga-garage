import { FileText, Printer } from "lucide-react";
import type { Waybill } from "@/entities/garage";
import { ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";

function formatDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function WaybillsBoard({
  waybills,
  onPrint,
}: {
  waybills: Waybill[];
  onPrint: (waybill: Waybill) => void;
}) {
  return (
    <>
      <div className={styles.requestsToolbar}>
        <span className={ui.muted}>
          Приказ Минтранса № 390 · путевой на машину · просмотр и печать без всплывающих окон
        </span>
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
                <th>Срок</th>
                <th>Машина</th>
                <th>Водитель</th>
                <th>Вид перевозки</th>
                <th>Одометр</th>
                <th>Печать</th>
              </tr>
            </thead>
            <tbody>
              {waybills.map((waybill) => (
                <tr key={waybill.id}>
                  <td className={ui.mono}>
                    {formatDate(waybill.validFrom)}
                    <div className={ui.muted}>— {formatDate(waybill.validTo)}</div>
                  </td>
                  <td>
                    <strong>{waybill.vehicleBrandModel}</strong>
                    <div className={ui.muted}>{waybill.vehiclePlate}</div>
                  </td>
                  <td>
                    {waybill.driverName}
                    <div className={ui.muted}>
                      ВУ {waybill.licenseSeries} {waybill.licenseNumber}
                    </div>
                  </td>
                  <td>
                    <span className={ui.muted}>{waybill.carriageKind}</span>
                    <div>{waybill.messageKind}</div>
                  </td>
                  <td className={ui.mono}>
                    {waybill.odometerStart.toLocaleString("ru-RU")}
                    {waybill.odometerEnd != null && (
                      <div className={ui.muted}>
                        → {waybill.odometerEnd.toLocaleString("ru-RU")}
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={ui.secondaryButton}
                      aria-label={`Распечатать путевой для ${waybill.vehicleBrandModel}`}
                      onClick={() => onPrint(waybill)}
                    >
                      <Printer size={16} />
                      Печать
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
