"use client";

import { useState, type FormEvent } from "react";
import { filterSnapshotByBranch, useGarage } from "@/entities/garage";
import { vehicleCategories } from "@/entities/vehicle";
import { isTransportUnitRole } from "@/shared/config";
import { useRole } from "@/shared/model/role-store";
import { useToast } from "@/shared/ui";
import { createRequest } from "../api/create-request";

export function useCreateRequest() {
  const { snapshot, setSnapshot } = useGarage();
  const { persona } = useRole();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const isTu = isTransportUnitRole(persona.role);
  const branches = snapshot?.branches ?? [];
  const [branchId, setBranchId] = useState(persona.branchId ?? branches[0]?.id ?? "");
  const scopedFleet =
    snapshot && (persona.branchId || branchId)
      ? filterSnapshotByBranch(snapshot, persona.branchId ?? branchId).fleet
      : snapshot?.fleet ?? [];
  const categories = vehicleCategories(scopedFleet);
  const [category, setCategory] = useState(categories[0] ?? "");
  const [priority, setPriority] = useState("normal");
  const [preferredVehicleId, setPreferredVehicleId] = useState("");

  function start() {
    const nextBranch = persona.branchId ?? branches[0]?.id ?? "";
    setBranchId(nextBranch);
    const fleetForStart =
      snapshot && nextBranch
        ? filterSnapshotByBranch(snapshot, nextBranch).fleet
        : snapshot?.fleet ?? [];
    const nextCategories = vehicleCategories(fleetForStart);
    setCategory(nextCategories[0] ?? "");
    setPriority("normal");
    setPreferredVehicleId("");
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function selectBranch(next: string) {
    setBranchId(next);
    if (!snapshot) return;
    const nextCategories = vehicleCategories(filterSnapshotByBranch(snapshot, next).fleet);
    setCategory(nextCategories[0] ?? "");
    setPreferredVehicleId("");
  }

  function selectCategory(next: string) {
    setCategory(next);
    setPreferredVehicleId("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const next = await createRequest({
        title: String(form.get("title")),
        location: String(form.get("location")),
        category,
        start: String(form.get("start")),
        end: String(form.get("end")),
        urgent: priority === "urgent",
        creatorId: persona.staffId,
        ...(isTu ? { branchId } : {}),
        ...(preferredVehicleId ? { preferredVehicleId } : {}),
      });
      setSnapshot(next);
      close();
      showToast({ kind: "success", title: `Заявка № ${next.requests[0].id} добавлена в очередь` });
    } catch (err) {
      showToast({ kind: "error", title: err instanceof Error ? err.message : "Ошибка создания заявки" });
    }
  }

  return {
    open,
    categories,
    category,
    setCategory: selectCategory,
    priority,
    setPriority,
    fleet: scopedFleet,
    preferredVehicleId,
    setPreferredVehicleId,
    branches: isTu ? branches : undefined,
    branchId,
    setBranchId: selectBranch,
    start,
    close,
    submit,
  };
}
