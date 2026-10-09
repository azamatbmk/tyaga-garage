"use client";

import { useState } from "react";
import type { Waybill } from "@/entities/garage";

export function usePrintWaybill() {
  const [waybill, setWaybill] = useState<Waybill | null>(null);

  function printWaybill(next: Waybill) {
    setWaybill(next);
  }

  function close() {
    setWaybill(null);
  }

  return { waybill, printWaybill, close };
}
