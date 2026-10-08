"use client";

import { GarageProvider } from "@/entities/garage";
import { RoleProvider } from "@/shared/model/role-store";
import { ToastProvider } from "@/shared/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RoleProvider>
        <GarageProvider>{children}</GarageProvider>
      </RoleProvider>
    </ToastProvider>
  );
}
