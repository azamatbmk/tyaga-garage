"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { filterSnapshotByBranch, useGarage } from "@/entities/garage";
import { pendingRequests } from "@/entities/request";
import { countByStatus, type Status } from "@/entities/vehicle";
import { AddVehicleDialog, useAddVehicle } from "@/features/add-vehicle";
import { useAssignDriver } from "@/features/assign-driver";
import { AssignRequestDialog, useAssignRequest } from "@/features/assign-request";
import { CreateRequestDialog, useCreateRequest } from "@/features/create-request";
import { ExportGarageButton } from "@/features/export-garage";
import { useFinishService } from "@/features/finish-service";
import { useIssueWaybill, WaybillFormDialog } from "@/features/issue-waybill";
import { PrintWaybillDialog, usePrintWaybill } from "@/features/print-waybill";
import { RoleSwitcher, useRole } from "@/features/switch-role";
import {
  DISPATCHER_NAV,
  FLEET_TABS,
  FLEET_TAB_COPY,
  GUP_DISPATCHER_NAV,
  PAGE_COPY,
  ROLE_LABEL,
  TRANSPORT_UNIT_SHORT,
  isTransportUnitRole,
  type FleetTab,
  type WorkspaceSection,
} from "@/shared/config";
import { Tabs, ui } from "@/shared/ui";
import { DispatchBoard } from "@/widgets/dispatch-board";
import { EventsSheet } from "@/widgets/events-sheet";
import { FleetPanel } from "@/widgets/fleet-panel";
import { FuelBoard } from "@/widgets/fuel-board";
import { GupBranchesBoard } from "@/widgets/gup-branches-board";
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
  const isTu = isTransportUnitRole(persona.role);
  const assign = useAssignRequest();
  const create = useCreateRequest();
  const addVehicle = useAddVehicle();
  const finish = useFinishService();
  const drivers = useAssignDriver();
  const print = usePrintWaybill();
  const waybillForm = useIssueWaybill();

  const [section, setSection] = useState<WorkspaceSection>("dispatch");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [allSchedule, setAllSchedule] = useState(false);
  const [scheduleMode, setScheduleMode] = useState("timeline");
  const [fleetFilter, setFleetFilter] = useState<"all" | Status>("all");
  const [fleetTab, setFleetTab] = useState<FleetTab>("units");
  const [query, setQuery] = useState("");
  const [requestFilter, setRequestFilter] = useState<"pending" | "assigned" | "all">("pending");
  const [readCount, setReadCount] = useState(0);

  const nav = isTu ? GUP_DISPATCHER_NAV : DISPATCHER_NAV;
  const activeSection =
    section === "waybills" || section === "timesheet" || section === "fuel"
      ? "fleet"
      : !isTu && section === "branches"
        ? "dispatch"
        : section;

  function navigate(next: WorkspaceSection) {
    if (next === "waybills" || next === "timesheet" || next === "fuel") {
      setSection("fleet");
      setFleetTab(next);
    } else {
      setSection(next);
      if (next === "fleet") setFleetTab("units");
    }
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

  const view = persona.branchId
    ? filterSnapshotByBranch(snapshot, persona.branchId)
    : snapshot;
  const pending = pendingRequests(view.requests);
  const serviceCount = countByStatus(view.fleet).service;
  const activeVehicle = view.fleet.find((vehicle) => vehicle.id === selected) ?? null;
  const sectionLabel = nav.find((item) => item.id === activeSection)?.label ?? "Диспетчерская";
  const pageCopy =
    activeSection === "fleet" ? FLEET_TAB_COPY[fleetTab] : PAGE_COPY[activeSection];
  const scopeLabel = isTu
    ? `${TRANSPORT_UNIT_SHORT} / ${ROLE_LABEL[persona.role].toUpperCase()}`
    : `${view.branch.name.toUpperCase()} / СМЕНА 08:00–20:00`;

  return (
    <div className={styles.root}>
      {menuOpen && <button className={styles.backdrop} aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
      <Sidebar
        view={activeSection}
        nav={nav}
        onNavigate={navigate}
        pending={pending.length}
        service={serviceCount}
        dispatchers={view.dispatchers}
        persona={persona}
        branchName={isTu ? TRANSPORT_UNIT_SHORT : view.branch.name}
        open={menuOpen}
      />
      <div className={styles.shell}>
        <Header
          view={activeSection}
          viewLabel={sectionLabel}
          unread={view.events.length > readCount}
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
                {scopeLabel}
              </div>
              <h1 className={styles.heading}>
                {sectionLabel}
                <span className={styles.headingDot}>.</span>
              </h1>
              <p>{pageCopy}</p>
            </div>
            <div className={styles.pageActions}>
              <ExportGarageButton />
              {activeSection === "fleet" && fleetTab === "waybills" ? (
                <button type="button" className={ui.primaryButton} onClick={waybillForm.startCreate}>
                  <Plus size={19} />
                  Выдать путевой
                </button>
              ) : activeSection === "fleet" && fleetTab === "units" ? (
                <button type="button" className={ui.primaryButton} onClick={addVehicle.start}>
                  <Plus size={19} />
                  Добавить технику
                </button>
              ) : activeSection !== "branches" && activeSection !== "fleet" ? (
                <button type="button" className={ui.primaryButton} onClick={create.start}>
                  <Plus size={19} />
                  Новая заявка
                </button>
              ) : null}
            </div>
          </div>

          {activeSection === "branches" && (
            <GupBranchesBoard
              snapshot={view}
              onOpenRequest={(request) =>
                request.assigned ? setSelected(request.assigned) : startAssign(request)
              }
              onSelectVehicle={setSelected}
            />
          )}
          {activeSection === "dispatch" && (
            <DispatchBoard
              fleet={view.fleet}
              jobs={view.jobs}
              requests={view.requests}
              events={view.events}
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
          {activeSection === "fleet" && (
            <>
              <div className={styles.fleetTabs}>
                <Tabs
                  value={fleetTab}
                  onChange={(value) => setFleetTab(value as FleetTab)}
                  tabs={FLEET_TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
                />
              </div>
              {fleetTab === "units" && (
                <FleetPanel
                  fleet={view.fleet}
                  jobs={view.jobs}
                  requests={view.requests}
                  filter={fleetFilter}
                  query={query}
                  onFilter={setFleetFilter}
                  onQuery={setQuery}
                  onSelect={setSelected}
                />
              )}
              {fleetTab === "waybills" && (
                <WaybillsBoard
                  waybills={view.waybills}
                  onPrint={print.printWaybill}
                  onEdit={waybillForm.startEdit}
                />
              )}
              {fleetTab === "timesheet" && (
                <TimesheetBoard entries={view.timesheet} drivers={view.drivers} />
              )}
              {fleetTab === "fuel" && <FuelBoard fuelings={view.fuelings} fleet={view.fleet} />}
            </>
          )}
          {activeSection === "requests" && (
            <RequestsBoard
              requests={view.requests}
              filter={requestFilter}
              onFilter={setRequestFilter}
              onOpen={(request) => (request.assigned ? setSelected(request.assigned) : startAssign(request))}
            />
          )}
          {activeSection === "team" && (
            <TeamBoard dispatchers={view.dispatchers} fleet={view.fleet} onSelect={setSelected} />
          )}
          {activeSection === "service" && <ServiceBoard fleet={view.fleet} onSelect={setSelected} />}

          <footer className={styles.footer}>
            <span>ТЯГА / Каждая смена в движении.</span>
            <span>{persona.name}</span>
          </footer>
        </main>
      </div>

      <VehicleSheet
        vehicle={activeVehicle}
        jobs={view.jobs}
        pending={pending}
        drivers={view.drivers}
        onClose={() => setSelected(null)}
        onAssign={startAssign}
        onFinishService={finish.complete}
        onChangeDriver={drivers.changeDriver}
      />
      {assign.request && (
        <AssignRequestDialog
          key={assign.request.id}
          request={assign.request}
          fleet={view.fleet}
          vehicleId={assign.vehicleId}
          onVehicleId={assign.setVehicleId}
          onClose={assign.close}
          onConfirm={async () => {
            const ok = await assign.confirm();
            if (ok) setAllSchedule(true);
          }}
        />
      )}
      <CreateRequestDialog
        open={create.open}
        categories={create.categories}
        category={create.category}
        priority={create.priority}
        branches={create.branches}
        branchId={create.branchId}
        fleet={create.fleet}
        preferredVehicleId={create.preferredVehicleId}
        onBranchId={create.setBranchId}
        onCategory={create.setCategory}
        onPriority={create.setPriority}
        onPreferredVehicleId={create.setPreferredVehicleId}
        onClose={create.close}
        onSubmit={create.submit}
      />
      {addVehicle.open && (
        <AddVehicleDialog
          key="add-vehicle"
          open={addVehicle.open}
          values={addVehicle.values}
          branches={addVehicle.branches}
          drivers={addVehicle.drivers}
          scanning={addVehicle.scanning}
          scanStatus={addVehicle.scanStatus}
          lockBranch={Boolean(persona.branchId)}
          onChange={addVehicle.setValues}
          onClose={addVehicle.close}
          onScanFile={addVehicle.scanFile}
          onSubmit={addVehicle.submit}
        />
      )}
      <EventsSheet open={noticeOpen} events={view.events} onClose={() => setNoticeOpen(false)} />
      <PrintWaybillDialog waybill={print.waybill} onClose={print.close} />
      {waybillForm.open && (
        <WaybillFormDialog
          key={waybillForm.editing?.id ?? "create-waybill"}
          open={waybillForm.open}
          mode={waybillForm.mode}
          fleet={view.fleet}
          waybill={waybillForm.editing}
          onClose={waybillForm.close}
          onSubmit={waybillForm.submit}
        />
      )}
    </div>
  );
}
