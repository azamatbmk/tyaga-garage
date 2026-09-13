"use client";

import { useState } from "react";
import { useToast } from "@/shared/ui";
import { downloadGarageExcel } from "../api/download-garage-excel";

export function useExportGarage() {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      const filename = await downloadGarageExcel();
      showToast({ kind: "success", title: `Смена выгружена: ${filename}` });
    } catch (err) {
      showToast({
        kind: "error",
        title: err instanceof Error ? err.message : "Не удалось выгрузить смену",
      });
    } finally {
      setBusy(false);
    }
  }

  return { download, busy };
}
