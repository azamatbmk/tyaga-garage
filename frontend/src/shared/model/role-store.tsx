"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  DEFAULT_PERSONA,
  DEMO_PERSONAS,
  personaByStaffId,
  type DemoPersona,
} from "@/shared/config";

type RoleContextValue = {
  persona: DemoPersona;
  personas: DemoPersona[];
  setStaffId: (staffId: string) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [staffId, setStaffId] = useState(DEFAULT_PERSONA.staffId);
  const persona = personaByStaffId(staffId);

  const value = useMemo(
    () => ({ persona, personas: DEMO_PERSONAS, setStaffId }),
    [persona],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}
