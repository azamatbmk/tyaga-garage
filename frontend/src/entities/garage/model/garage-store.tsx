"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getGarage } from "../api/get-garage";
import type { GarageSnapshot } from "./types";

type GarageContextValue = {
  snapshot: GarageSnapshot | null;
  error: string | null;
  setSnapshot: (snapshot: GarageSnapshot) => void;
};

const GarageContext = createContext<GarageContextValue | null>(null);

export function GarageProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<GarageSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGarage()
      .then(setSnapshot)
      .catch((err: Error) => setError(err.message));
  }, []);

  const value = useMemo(
    () => ({ snapshot, error, setSnapshot }),
    [snapshot, error],
  );

  return <GarageContext.Provider value={value}>{children}</GarageContext.Provider>;
}

export function useGarage() {
  const context = useContext(GarageContext);
  if (!context) {
    throw new Error("useGarage must be used within GarageProvider");
  }
  return context;
}
