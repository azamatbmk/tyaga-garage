"use client";

import { useRole } from "@/features/switch-role";
import { ApplicantPage } from "@/views/applicant";
import { BranchControlPage } from "@/views/branch-control";
import { GaragePage } from "@/views/garage";

export default function Home() {
  const { persona } = useRole();

  if (persona.workspace === "applicant") {
    return <ApplicantPage />;
  }
  if (persona.workspace === "branch_chief") {
    return <BranchControlPage />;
  }
  return <GaragePage />;
}
