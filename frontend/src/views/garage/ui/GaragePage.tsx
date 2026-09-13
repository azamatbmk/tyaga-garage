"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useGarage } from "@/entities/garage";
import { pendingRequests } from "@/entities/request";
import { countByStatus, type Status } from "@/entities/vehicle";
import { AssignRequestDialog, useAssignRequest } from "@/features/assign-request";
import { CreateRequestDialog, useCreateRequest } from "@/features/create-request";
import { useFinishService } from "@/features/finish-service";
import { NAV, PAGE_COPY, type WorkspaceSection } from "@/shared/config";
import { ui } from "@/shared/ui";
import { DispatchBoard } from "@/widgets/dispatch-board";
import { EventsSheet } from "@/widgets/events-sheet";
import { FleetPanel } from "@/widgets/fleet-panel";
import { Header } from "@/widgets/header";
import { RequestsBoard } from "@/widgets/requests-board";
import { ServiceBoard } from "@/widgets/service-board";
import { Sidebar } from "@/widgets/sidebar";
import { TeamBoard } from "@/widgets/team-board";
import { VehicleSheet } from "@/widgets/vehicle-sheet";
import styles from "@/shared/styles/layout.module.css";

export function GaragePage() {
  const { snapshot, error } = useGarage();
  const assign = useAssignRequest();
  const create = useCreateRequest();
  const finish = useFinishService();

  const [section, setSection] = useState<WorkspaceSection>("dispatch");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [allSchedule, setAllSchedule] = useState(false);
  const [scheduleMode, setScheduleMode] = useState("timeline");
  const [fleetFilter, setFleetFilter] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [requestFilter, setRequestFilter] = useState<"pending" | "assigned" | "all">("pending");
  const [readCount, setReadCount] = useState(0);

  function navigate(next: WorkspaceSection) {
    setSection(next);
    setQuery("");
    setFleetFilter("all");
    setMenuOpen(false);
  }

  function openEvents() {
    if (!snapshot) return;
    setNoticeOpen(true);
    setReadCount(snapshot.events.length);
  }

  function startAssign(...args: Parameters<typeof assign.start>) {
    setSelected(null);
    assign.start(...args);
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <h1>Не удалось открыть диспетчерскую</h1>
        <p>{error}. Запустите Nest API на порту 3001 и обновите страницу.</p>
      </div>
    );
  }

  if (!snapshot) {
    return <div className={styles.boot}>Загружаем смену…</div>;
  }

  const pending = pendingRequests(snapshot.requests);
  const serviceCount = countByStatus(snapshot.fleet).service;
  const activeVehicle = snapshot.fleet.find((vehicle) => vehicle.id === selected) ?? null;

  return (
    <div className={styles.root}>
      {menuOpen && <button className={styles.backdrop} aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
      <Sidebar
        view={section}
        onNavigate={navigate}
        pending={pending.length}
        service={serviceCount}
        dispatchers={snapshot.dispatchers}
        open={menuOpen}
      />
      <div className={styles.shell}>
        <Header
          view={section}
          unread={snapshot.events.length > readCount}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenEvents={openEvents}
          onOpenTeam={() => navigate("team")}
        />
        <main className={styles.workspace}>
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.pageEyebrow}>
                <span className={styles.liveDot} />
                ОСНОВНОЙ ГАРАЖ / СМЕНА 08:00–20:00
              </div>
              <h1 className={styles.heading}>
                {NAV.find((item) => item.id === section)?.label}
                <span className={styles.headingDot}>.</span>
              </h1>
              <p>{PAGE_COPY[section]}</p>
            </div>
            <button className={ui.primaryButton} onClick={create.start}>
              <Plus size={19} />
              Новая заявка
            </button>
          </div>

          {section === "dispatch" && (
            <DispatchBoard
              fleet={snapshot.fleet}
              jobs={snapshot.jobs}
              requests={snapshot.requests}
              events={snapshot.events}
              allSchedule={allSchedule}
              scheduleMode={scheduleMode}
              onAllSchedule={setAllSchedule}
              onScheduleMode={setScheduleMode}
              onOpenFleet={(filter) => {
                navigate("fleet");
                if (filter) setFleetFilter(filter);
              }}
              onOpenService={() => navigate("service")}
              onOpenRequests={() => navigate("requests")}
              onSelect={setSelected}
              onAssign={startAssign}
              onOpenEvents={openEvents}
            />
          )}
          {section === "fleet" && (
            <FleetPanel
              fleet={snapshot.fleet}
              filter={fleetFilter}
              query={query}
              onFilter={setFleetFilter}
              onQuery={setQuery}
              onSelect={setSelected}
            />
          )}
          {section === "requests" && (
            <RequestsBoard
              requests={snapshot.requests}
              filter={requestFilter}
              onFilter={setRequestFilter}
              onOpen={(request) => (request.assigned ? setSelected(request.assigned) : startAssign(request))}
            />
          )}
          {section === "team" && (
            <TeamBoard dispatchers={snapshot.dispatchers} fleet={snapshot.fleet} onSelect={setSelected} />
          )}
          {section === "service" && <ServiceBoard fleet={snapshot.fleet} onSelect={setSelected} />}

          <footer className={styles.footer}>
            <span>ТЯГА / Каждая смена в движении.</span>
            <span>Демонстрационный гараж · 12.09.2026</span>
          </footer>
        </main>
      </div>

      <VehicleSheet
        vehicle={activeVehicle}
        jobs={snapshot.jobs}
        pending={pending}
        onClose={() => setSelected(null)}
        onAssign={startAssign}
        onFinishService={finish.complete}
      />
      <AssignRequestDialog
        request={assign.request}
        fleet={snapshot.fleet}
        vehicleId={assign.vehicleId}
        onVehicleId={assign.setVehicleId}
        onClose={assign.close}
        onConfirm={async () => {
          const ok = await assign.confirm();
          if (ok) setAllSchedule(true);
        }}
      />
      <CreateRequestDialog
        open={create.open}
        categories={create.categories}
        category={create.category}
        priority={create.priority}
        onCategory={create.setCategory}
        onPriority={create.setPriority}
        onClose={create.close}
        onSubmit={create.submit}
      />
      <EventsSheet open={noticeOpen} events={snapshot.events} onClose={() => setNoticeOpen(false)} />
    </div>
  );
}
