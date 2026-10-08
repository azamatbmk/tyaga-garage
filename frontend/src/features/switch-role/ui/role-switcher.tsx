"use client";

import { ROLE_LABEL } from "@/shared/config";
import { useRole } from "@/shared/model/role-store";
import styles from "@/shared/styles/layout.module.css";

export function RoleSwitcher() {
  const { persona, personas, setStaffId } = useRole();

  return (
    <label className={styles.roleSwitcher}>
      <span className={styles.roleSwitcherLabel}>Роль</span>
      <select
        aria-label="Переключить демо-роль"
        value={persona.staffId}
        onChange={(event) => setStaffId(event.target.value)}
      >
        {personas.map((item) => (
          <option key={item.staffId} value={item.staffId}>
            {item.label}
          </option>
        ))}
      </select>
      <span className={styles.roleSwitcherHint}>{ROLE_LABEL[persona.role]}</span>
    </label>
  );
}
