"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useGarage } from "@/entities/garage";
import { RequestCard, requestsByCreator } from "@/entities/request";
import { CreateRequestDialog, useCreateRequest } from "@/features/create-request";
import { RoleSwitcher, useRole } from "@/features/switch-role";
import { APPLICANT_NAV, PAGE_COPY, ROLE_LABEL, type WorkspaceSection } from "@/shared/config";
import { ui } from "@/shared/ui";
import { Header } from "@/widgets/header";
import { Sidebar } from "@/widgets/sidebar";
import styles from "@/shared/styles/layout.module.css";
import panelStyles from "@/shared/styles/panels.module.css";

export function ApplicantPage() {
  const { snapshot, error } = useGarage();
  const { persona } = useRole();
  const create = useCreateRequest();
  const [menuOpen, setMenuOpen] = useState(false);
  const [section] = useState<WorkspaceSection>("my-requests");

  if (error) {
    return (
      <div className={styles.errorState}>
        <h1>Не удалось открыть рабочее место</h1>
        <p>{error}. Запустите Nest API на порту 3001 и обновите страницу.</p>
      </div>
    );
  }

  if (!snapshot) {
    return <div className={styles.boot}>Загружаем смену…</div>;
  }

  const mine = requestsByCreator(snapshot.requests, persona.staffId);

  return (
    <div className={styles.root}>
      {menuOpen && <button className={styles.backdrop} aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
      <Sidebar
        view={section}
        nav={APPLICANT_NAV}
        onNavigate={() => setMenuOpen(false)}
        pending={mine.filter((item) => !item.assigned).length}
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
          viewLabel="Мои заявки"
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
                Мои заявки
                <span className={styles.headingDot}>.</span>
              </h1>
              <p>{PAGE_COPY["my-requests"]}</p>
            </div>
            <div className={styles.pageActions}>
              <button type="button" className={ui.primaryButton} onClick={create.start}>
                <Plus size={19} />
                Новая заявка
              </button>
            </div>
          </div>

          {mine.length ? (
            <div className={panelStyles.requestsGrid}>
              {mine.map((request) => (
                <RequestCard key={request.id} request={request} readOnly />
              ))}
            </div>
          ) : (
            <div className={`${panelStyles.panel} ${ui.empty}`}>
              <h3>Пока нет ваших заявок</h3>
              <p>Создайте заявку на технику — диспетчер увидит её в очереди филиала.</p>
            </div>
          )}

          <footer className={styles.footer}>
            <span>ТЯГА / Заявки заявителя.</span>
            <span>{persona.name}</span>
          </footer>
        </main>
      </div>

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
    </div>
  );
}
