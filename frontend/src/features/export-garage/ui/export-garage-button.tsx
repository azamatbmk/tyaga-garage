"use client";

import { Download } from "lucide-react";
import { ui } from "@/shared/ui";
import { useExportGarage } from "../model/use-export-garage";

export function ExportGarageButton() {
  const { download, busy } = useExportGarage();

  return (
    <button
      type="button"
      className={ui.secondaryButton}
      onClick={download}
      disabled={busy}
      aria-busy={busy}
      aria-label="Выгрузить смену в Excel"
    >
      <Download size={18} />
      {busy ? "Выгружаем…" : "В Excel"}
    </button>
  );
}
