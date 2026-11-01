"use client";

import { LoginScreen } from "@/features/sign-in";
import { useSession } from "@/features/switch-role";
import { ApplicantPage } from "@/views/applicant";
import { BranchControlPage } from "@/views/branch-control";
import { GaragePage } from "@/views/garage";
import styles from "@/shared/styles/layout.module.css";

export default function Home() {
  const { persona, ready } = useSession();

  if (!ready) {
    return <div className={styles.boot}>Проверяем вход…</div>;
  }
  if (!persona) {
    return <LoginScreen />;
  }

  if (persona.workspace === "applicant") {
    return <ApplicantPage />;
  }
  if (persona.workspace === "branch_chief") {
    return <BranchControlPage />;
  }
  return <GaragePage />;
}
