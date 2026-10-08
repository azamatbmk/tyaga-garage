import type { Waybill } from "@/entities/garage";
import type { Vehicle } from "@/entities/vehicle";

function formatWeekStart(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function openWaybillPrint(params: {
  waybill: Waybill;
  vehicle?: Vehicle;
  branchName: string;
}) {
  const { waybill, vehicle, branchName } = params;
  const popup = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!popup) {
    throw new Error("Разрешите всплывающие окна для печати путевого");
  }

  const rows = [
    ["Дата / начало недели", formatWeekStart(waybill.weekStart)],
    ["Бортовой №", vehicle?.id ?? waybill.vehicleId],
    ["Марка / модель", vehicle?.name ?? "—"],
    ["Гос. номер", vehicle?.plate ?? "—"],
    ["Фамилия, имя водителя", waybill.driverName],
    ["Категория прав", waybill.licenseCategory],
    ["Начальный километраж", `${waybill.odometerStart.toLocaleString("ru-RU")} км`],
    ["Тип техники", vehicle?.category ?? "—"],
  ];

  popup.document.write(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Путевой лист · ${escapeHtml(vehicle?.name ?? waybill.vehicleId)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Times New Roman", Times, serif;
      color: #111;
      background: #fff;
    }
    .toolbar {
      position: sticky;
      top: 0;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px;
      background: #f4f6f0;
      border-bottom: 1px solid #d8e0ce;
    }
    .toolbar button {
      font: 14px/1.2 system-ui, sans-serif;
      padding: 8px 14px;
      border-radius: 6px;
      border: 1px solid #c9d4bb;
      background: #fff;
      cursor: pointer;
    }
    .toolbar .primary {
      background: #cfee7a;
      border-color: #b7db5f;
      font-weight: 600;
    }
    .sheet {
      max-width: 720px;
      margin: 24px auto;
      padding: 28px 32px;
    }
    h1 {
      margin: 0;
      text-align: center;
      font-size: 22px;
    }
    .org, .sub {
      text-align: center;
      margin: 0 0 8px;
      color: #444;
      font-size: 13px;
    }
    .sub { margin-bottom: 20px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    th, td {
      border: 1px solid #333;
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }
    th {
      width: 42%;
      background: #f3f3f3;
      font-weight: 600;
    }
    .notes { margin-bottom: 32px; }
    .notes h2 {
      margin: 0 0 12px;
      font-size: 15px;
    }
    .line {
      border-bottom: 1px solid #333;
      height: 28px;
      margin-bottom: 8px;
    }
    .signs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      font-size: 14px;
    }
    .sign-line {
      margin-top: 36px;
      border-bottom: 1px solid #111;
    }
    @media print {
      .toolbar { display: none !important; }
      .sheet { margin: 0; padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="window.close()">Закрыть</button>
    <button type="button" class="primary" onclick="window.print()">Распечатать</button>
  </div>
  <main class="sheet">
    <p class="org">${escapeHtml(branchName)}</p>
    <h1>Путевой лист</h1>
    <p class="sub">На неделю · спецтехника</p>
    <table>
      <tbody>
        ${rows
          .map(
            ([label, value]) =>
              `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
    <section class="notes">
      <h2>Отметки смены</h2>
      <div class="line"></div>
      <div class="line"></div>
      <div class="line"></div>
    </section>
    <div class="signs">
      <div>
        <div>Диспетчер</div>
        <div class="sign-line"></div>
      </div>
      <div>
        <div>Водитель</div>
        <div class="sign-line"></div>
      </div>
    </div>
  </main>
  <script>
    window.addEventListener("load", function () {
      window.focus();
    });
  </script>
</body>
</html>`);
  popup.document.close();
}
