"use client";

import { Printer, X } from "lucide-react";
import type { Waybill } from "@/entities/garage";
import { Modal, ui } from "@/shared/ui";
import { WaybillPrintDocument } from "./waybill-print-document";
import styles from "./waybill-print.module.css";

export function PrintWaybillDialog({
  waybill,
  onClose,
}: {
  waybill: Waybill | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!waybill} onClose={onClose}>
      {waybill && (
        <div
          className={styles.dialog}
          data-print-root
          role="dialog"
          aria-labelledby="waybill-print-title"
        >
          <div className={styles.toolbar}>
            <div>
              <h2 id="waybill-print-title">Просмотр путевого</h2>
              <p className={styles.lead}>
                {waybill.vehicleBrandModel} · {waybill.driverName}. Дальше — «Распечатать» или «Сохранить как PDF».
              </p>
            </div>
            <div className={styles.actions}>
              <button type="button" className={ui.primaryButton} onClick={() => window.print()}>
                <Printer size={18} />
                Распечатать
              </button>
              <button type="button" className={ui.iconButton} aria-label="Закрыть просмотр путевого" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>
          <WaybillPrintDocument waybill={waybill} />
        </div>
      )}
    </Modal>
  );
}
