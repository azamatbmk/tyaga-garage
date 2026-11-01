"use client";

import { useRole } from "@/shared/model";
import styles from "@/shared/styles/layout.module.css";

export function LogoutButton() {
  const { logout } = useRole();

  return (
    <button type="button" className={styles.roleSwitcher} onClick={() => void logout()}>
      Выйти
    </button>
  );
}
