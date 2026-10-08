"use client";

import type { Waybill } from "@/entities/garage";
import type { Vehicle } from "@/entities/vehicle";
import { useToast } from "@/shared/ui";
import { openWaybillPrint } from "../lib/open-waybill-print";

export function usePrintWaybill() {
  const { showToast } = useToast();

  function printWaybill(params: {
    waybill: Waybill;
    vehicle?: Vehicle;
    branchName: string;
  }) {
    try {
      openWaybillPrint(params);
    } catch (err) {
      showToast({
        kind: "error",
        title: err instanceof Error ? err.message : "Не удалось открыть печать",
      });
    }
  }

  return { printWaybill };
}
