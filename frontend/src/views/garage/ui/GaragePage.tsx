"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useGarage } from "@/entities/garage";
import { pendingRequests } from "@/entities/request";
import { countByStatus, type Status } from "@/entities/vehicle";
import { useAssignDriver } from "@/features/assign-driver";
import { AssignRequestDialog, useAssignRequest } from "@/features/assign-request";
import { CreateRequestDialog, useCreateRequest } from "@/features/create-request";
import { ExportGarageButton } from "@/features/export-garage";
import { useFinishService } from "@/features/finish-service";
import { PrintWaybillDialog, usePrintWaybill } from "@/features/print-waybill";
import { RoleSwitcher, useRole } from "@/features/switch-role";
import { DISPATCHER_NAV, PAGE_COPY, type WorkspaceSection } from "@/shared/config";
import { ui } from "@/shared/ui";
import { DispatchBoard } from "@/widgets/dispatch-board";
import { EventsSheet } from "@/widgets/events-sheet";
import { FleetPanel } from "@/widgets/fleet-panel";
import { FuelBoard } from "@/widgets/fuel-board";
import { Header } from "@/widgets/header";
import { RequestsBoard } from "@/widgets/requests-board";
import { ServiceBoard } from "@/widgets/service-board";
import { Sidebar } from "@/widgets/sidebar";
import { TeamBoard } from "@/widgets/team-board";
import { TimesheetBoard } from "@/widgets/timesheet-board";
import { VehicleSheet } from "@/widgets/vehicle-sheet";
import { WaybillsBoard } from "@/widgets/waybills-board";
import styles from "@/shared/styles/layout.module.css";

export function GaragePage() {
  const { snapshot, error } = useGarage();
  const { persona } = useRole();
  const assign = useAssignRequest();
  const create = useCreateRequest();
  const finish = useFinishService();
  const drivers = useAssignDriver();
  const print = usePrintWaybill();

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
  const sectionLabel = DISPATCHER_NAV.find((item) => item.id === section)?.label ?? "Диспетчерская";

  return (
    <div className={styles.root}>
      {menuOpen && <button className={styles.backdrop} aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
      <Sidebar
        view={section}
        nav={DISPATCHER_NAV}
        onNavigate={navigate}
        pending={pending.length}
        service={serviceCount}
        dispatchers={snapshot.dispatchers}
        persona={persona}
        branchName={snapshot.branch.name}
        open={menuOpen}
      />
      <div className={styles.shell}>
        <Header
          view={section}
          unread={snapshot.events.length > readCount}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenEvents={openEvents}
          onOpenTeam={() => navigate("team")}
          roleSwitcher={<RoleSwitcher />}
        />
        <main className={styles.workspace}>
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.pageEyebrow}>
                <span className={styles.liveDot} />
                {snapshot.branch.name.toUpperCase()} / СМЕНА 08:00–20:00
              </div>
              <h1 className={styles.heading}>
                {sectionLabel}
                <span className={styles.headingDot}>.</span>
              </h1>
              <p>{PAGE_COPY[section]}</p>
            </div>
            <div className={styles.pageActions}>
              <ExportGarageButton />
              <button type="button" className={ui.primaryButton} onClick={create.start}>
                <Plus size={19} />
                Новая заявка
              </button>
            </div>
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
          {section === "waybills" && (
            <WaybillsBoard waybills={snapshot.waybills} onPrint={print.printWaybill} />
          )}
          {section === "timesheet" && (
            <TimesheetBoard entries={snapshot.timesheet} drivers={snapshot.drivers} />
          )}
          {section === "fuel" && <FuelBoard fuelings={snapshot.fuelings} fleet={snapshot.fleet} />}
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
        drivers={snapshot.drivers}
        onClose={() => setSelected(null)}
        onAssign={startAssign}
        onFinishService={finish.complete}
        onChangeDriver={drivers.changeDriver}
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
      <PrintWaybillDialog waybill={print.waybill} onClose={print.close} />
    </div>
  );
}
