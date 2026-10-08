"use client";

import { useState } from "react";
import { useGarage } from "@/entities/garage";
import { RequestCard, requestsByBranch } from "@/entities/request";
import { RoleSwitcher, useRole } from "@/features/switch-role";
import { BRANCH_NAV, PAGE_COPY, ROLE_LABEL, type WorkspaceSection } from "@/shared/config";
import { Tabs, ui } from "@/shared/ui";
import { Header } from "@/widgets/header";
import { Sidebar } from "@/widgets/sidebar";
import styles from "@/shared/styles/layout.module.css";
import panelStyles from "@/shared/styles/panels.module.css";

export function BranchControlPage() {
  const { snapshot, error } = useGarage();
  const { persona } = useRole();
  const [menuOpen, setMenuOpen] = useState(false);
  const [section] = useState<WorkspaceSection>("branch-requests");
  const [filter, setFilter] = useState<"all" | "pending" | "assigned">("all");

  if (error) {
    return (
      <div className={styles.errorState}>
        <h1>Не удалось открыть контроль филиала</h1>
        <p>{error}. Запустите Nest API на порту 3001 и обновите страницу.</p>
      </div>
    );
  }

  if (!snapshot) {
    return <div className={styles.boot}>Загружаем смену…</div>;
  }

  const branchRequests = requestsByBranch(snapshot.requests, snapshot.branch.id);
  const pending = branchRequests.filter((item) => !item.assigned);
  const assigned = branchRequests.filter((item) => item.assigned);
  const visible = branchRequests.filter((item) =>
    filter === "all" ? true : filter === "assigned" ? !!item.assigned : !item.assigned,
  );

  const staffName = (creatorId: string) =>
    snapshot.staff.find((user) => user.id === creatorId)?.name ?? creatorId;

  return (
    <div className={styles.root}>
      {menuOpen && <button className={styles.backdrop} aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
      <Sidebar
        view={section}
        nav={BRANCH_NAV}
        onNavigate={() => setMenuOpen(false)}
        pending={pending.length}
        service={0}
        dispatchers={snapshot.dispatchers}
        persona={persona}
        branchName={snapshot.branch.name}
        open={menuOpen}
        showShift={false}
      />
      <div className={styles.shell}>
        <Header
          view={section}
          viewLabel="Заявки филиала"
          unread={false}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenEvents={() => undefined}
          showEvents={false}
          roleSwitcher={<RoleSwitcher />}
        />
        <main className={styles.workspace}>
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.pageEyebrow}>
                <span className={styles.liveDot} />
                {snapshot.branch.name.toUpperCase()} / {ROLE_LABEL[persona.role].toUpperCase()}
              </div>
              <h1 className={styles.heading}>
                Заявки филиала
                <span className={styles.headingDot}>.</span>
              </h1>
              <p>{PAGE_COPY["branch-requests"]}</p>
            </div>
          </div>

          <div className={panelStyles.requestsToolbar}>
            <Tabs
              value={filter}
              onChange={(value) => setFilter(value as "all" | "pending" | "assigned")}
              tabs={[
                { value: "all", label: "Все", count: branchRequests.length },
                { value: "pending", label: "В очереди", count: pending.length },
                { value: "assigned", label: "Назначены", count: assigned.length },
              ]}
            />
            <span className={ui.muted}>Только просмотр · без назначения техники</span>
          </div>

          {visible.length ? (
            <div className={panelStyles.requestsGrid}>
              {visible.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  readOnly
                  meta={`Заявитель: ${staffName(request.creatorId)}`}
                />
              ))}
            </div>
          ) : (
            <div className={`${panelStyles.panel} ${ui.empty}`}>
              <h3>Заявок по фильтру нет</h3>
              <p>Здесь появятся все заявки сотрудников филиала.</p>
            </div>
          )}

          <footer className={styles.footer}>
            <span>ТЯГА / Контроль филиала.</span>
            <span>{persona.name}</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
