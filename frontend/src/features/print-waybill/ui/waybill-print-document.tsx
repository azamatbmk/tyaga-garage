import type { Waybill } from "@/entities/garage";
import styles from "./waybill-print.module.css";

function formatDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

function formatDateTime(iso: string) {
  const date = formatDate(iso);
  const timeMatch = /T(\d{2}):(\d{2})/.exec(iso);
  if (!timeMatch) return date;
  return `${date} ${timeMatch[1]}:${timeMatch[2]}`;
}

function Section({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <>
      <h2>{title}</h2>
      <table className={styles.table}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function WaybillPrintDocument({ waybill }: { waybill: Waybill }) {
  const validity =
    waybill.validFrom === waybill.validTo
      ? formatDate(waybill.validFrom)
      : `${formatDate(waybill.validFrom)} — ${formatDate(waybill.validTo)}`;

  return (
    <article className={styles.sheet} aria-label={`Путевой лист ${waybill.id}`}>
      <p className={styles.org}>{waybill.issuerName}</p>
      <h1>Путевой лист</h1>
      <p className={styles.sub}>Срок действия: {validity}</p>
      <p className={styles.basis}>Состав сведений — приказ Минтранса России от 28.09.2022 № 390</p>

      <Section
        title="1. Лицо, оформившее путевой лист"
        rows={[
          ["Полное наименование", waybill.issuerName],
          ["Адрес", waybill.issuerAddress],
          ["Телефон", waybill.issuerPhone],
          ["ОГРН", waybill.issuerOgrn],
        ]}
      />
      <Section
        title="2. Транспортное средство"
        rows={[
          ["Тип ТС", waybill.vehicleType],
          ["Марка / модель", waybill.vehicleBrandModel],
          ["Гос. регистрационный номер", waybill.vehiclePlate],
          ["Предрейсовый / предсменный контроль ТС", formatDateTime(waybill.techControlAt)],
          ["Результат контроля ТС", waybill.techControlResult],
          ["Контролёр", waybill.techControllerName],
          ["Выпуск на линию", formatDateTime(waybill.departureAt)],
          ["Возврат с линии", waybill.returnAt ? formatDateTime(waybill.returnAt) : "—"],
          ["Одометр при выпуске", `${waybill.odometerStart.toLocaleString("ru-RU")} км`],
          [
            "Одометр при возврате",
            waybill.odometerEnd != null ? `${waybill.odometerEnd.toLocaleString("ru-RU")} км` : "—",
          ],
        ]}
      />
      <Section
        title="3. Водитель"
        rows={[
          ["Фамилия, имя, отчество", waybill.driverName],
          [
            "Водительское удостоверение",
            `${waybill.licenseSeries} № ${waybill.licenseNumber}, выдано ${formatDate(waybill.licenseIssuedAt)}`,
          ],
          ["Категория прав", waybill.licenseCategory],
          ["СНИЛС", waybill.snils],
          ["Медосмотр (дата и время)", formatDateTime(waybill.medicalExamAt)],
          ["Результат медосмотра", waybill.medicalExamResult],
          ["Медработник", waybill.medicName],
        ]}
      />
      <Section
        title="4. Вид перевозки и вид сообщения"
        rows={[
          ["Вид перевозки", waybill.carriageKind],
          ["Вид сообщения", waybill.messageKind],
        ]}
      />

      <div className={styles.signs}>
        <div>
          <div>Диспетчер / оформивший</div>
          <div className={styles.signLine} />
        </div>
        <div>
          <div>Контролёр ТС</div>
          <div className={styles.signLine} />
        </div>
        <div>
          <div>Водитель</div>
          <div className={styles.signLine} />
        </div>
      </div>
    </article>
  );
}
