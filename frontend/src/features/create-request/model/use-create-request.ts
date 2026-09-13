"use client";

import { useState, type FormEvent } from "react";
import { useGarage } from "@/entities/garage";
import { vehicleCategories } from "@/entities/vehicle";
import { useToast } from "@/shared/ui";
import { createRequest } from "../api/create-request";

export function useCreateRequest() {
  const { snapshot, setSnapshot } = useGarage();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const categories = snapshot ? vehicleCategories(snapshot.fleet) : [];
  const [category, setCategory] = useState(categories[0] ?? "");
  const [priority, setPriority] = useState("normal");

  function start() {
    setCategory(categories[0] ?? "");
    setPriority("normal");
    setOpen(true);
  }

  function close() {
    setOpen(false);
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
      });
      setSnapshot(next);
      close();
      showToast({ kind: "success", title: `Заявка № ${next.requests[0].id} добавлена в очередь` });
    } catch (err) {
      showToast({ kind: "error", title: err instanceof Error ? err.message : "Ошибка создания заявки" });
    }
  }

  return { open, categories, category, setCategory, priority, setPriority, start, close, submit };
}
