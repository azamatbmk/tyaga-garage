"use client";

import { GarageProvider } from "@/entities/garage";
import { ToastProvider } from "@/shared/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <GarageProvider>{children}</GarageProvider>
    </ToastProvider>
  );
}
