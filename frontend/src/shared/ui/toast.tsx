"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { cx } from "@/shared/lib";
import styles from "./ui.module.css";

export type ToastState = {
  kind: "success" | "error";
  title: string;
  description?: string;
} | null;

type ToastContextValue = {
  toast: ToastState;
  showToast: (toast: NonNullable<ToastState>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((next: NonNullable<ToastState>) => {
    setToast(next);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ toast, showToast }), [toast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className={cx(styles.toast, toast.kind === "error" && styles.toastError)} role="status">
          <strong className={styles.toastTitle}>{toast.title}</strong>
          {toast.description && <p className={styles.toastDetail}>{toast.description}</p>}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
