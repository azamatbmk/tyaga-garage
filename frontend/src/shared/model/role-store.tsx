"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { workspaceForRole, type DemoPersona, type StaffRole } from "@/shared/config";
import { apiRequest } from "@/shared/api";

type SessionUser = {
  staffId: string;
  name: string;
  initials: string;
  role: StaffRole;
  branchId: string | null;
  workspace: DemoPersona["workspace"];
};

type LoginStaff = {
  id: string;
  name: string;
  role: StaffRole;
};

type RoleContextValue = {
  ready: boolean;
  persona: DemoPersona | null;
  loginStaff: LoginStaff[];
  login: (staffId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const RoleContext = createContext<RoleContextValue | null>(null);

function toPersona(user: SessionUser): DemoPersona {
  return {
    staffId: user.staffId,
    role: user.role,
    workspace: user.workspace ?? workspaceForRole(user.role),
    name: user.name,
    initials: user.initials,
    branchId: user.branchId,
  };
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<DemoPersona | null>(null);
  const [loginStaff, setLoginStaff] = useState<LoginStaff[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiRequest<SessionUser>("/api/auth/me")
      .then((user) => {
        if (!cancelled) setPersona(toPersona(user));
      })
      .catch(() => {
        if (!cancelled) setPersona(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || persona) return;
    let cancelled = false;
    apiRequest<LoginStaff[]>("/api/auth/staff")
      .then((staff) => {
        if (!cancelled) setLoginStaff(staff);
      })
      .catch(() => {
        if (!cancelled) setLoginStaff([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, persona]);

  const login = useCallback(async (staffId: string, password: string) => {
    const user = await apiRequest<SessionUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ staffId, password }),
    });
    setPersona(toPersona(user));
  }, []);

  const logout = useCallback(async () => {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setPersona(null);
  }, []);

  const value = useMemo(
    () => ({ ready, persona, loginStaff, login, logout }),
    [ready, persona, loginStaff, login, logout],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useSession() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useSession must be used within RoleProvider");
  }
  return context;
}

export function useRole() {
  const context = useSession();
  if (!context.persona) {
    throw new Error("useRole requires a signed-in employee");
  }
  return { persona: context.persona, logout: context.logout };
}
