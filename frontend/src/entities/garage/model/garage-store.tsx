"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "@/shared/model";
import { getGarage } from "../api/get-garage";
import type { GarageSnapshot } from "./types";

type GarageContextValue = {
  snapshot: GarageSnapshot | null;
  error: string | null;
  setSnapshot: (snapshot: GarageSnapshot) => void;
};

const GarageContext = createContext<GarageContextValue | null>(null);

export function GarageProvider({ children }: { children: React.ReactNode }) {
  const { persona, ready } = useSession();
  const staffId = persona?.staffId ?? null;
  const [snapshot, setSnapshot] = useState<GarageSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackedStaffId, setTrackedStaffId] = useState<string | null>(staffId);

  if (staffId !== trackedStaffId) {
    setTrackedStaffId(staffId);
    setSnapshot(null);
    setError(null);
  }

  useEffect(() => {
    if (!ready || !staffId) return;
    let cancelled = false;
    getGarage()
      .then((next) => {
        if (!cancelled) setSnapshot(next);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, staffId]);

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
