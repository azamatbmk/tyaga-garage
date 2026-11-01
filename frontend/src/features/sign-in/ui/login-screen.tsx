"use client";

import { type FormEvent, useState } from "react";
import { ROLE_LABEL } from "@/shared/config";
import { useSession } from "@/shared/model";
import { ui } from "@/shared/ui";
import styles from "./login-screen.module.css";

export function LoginScreen() {
  const { loginStaff, login } = useSession();
  const [staffId, setStaffId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const selected = staffId || loginStaff[0]?.id || "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      await login(selected, String(form.get("password") ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={submit}>
        <p className={styles.kicker}>ТЯГА</p>
        <h1>Вход</h1>
        <p className={styles.lead}>
          Демо-пароль для всех сотрудников: <strong>tyaga-demo</strong>
        </p>
        <label className={styles.field}>
          <span>Сотрудник</span>
          <select
            aria-label="Сотрудник"
            value={selected}
            onChange={(event) => setStaffId(event.target.value)}
          >
            {loginStaff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} · {ROLE_LABEL[person.role]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Пароль</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={ui.primaryButton} type="submit" disabled={pending || !selected}>
          {pending ? "Входим…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
