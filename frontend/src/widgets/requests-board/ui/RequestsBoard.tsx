import { ClipboardList } from "lucide-react";
import { RequestCard, type RequestItem } from "@/entities/request";
import { Tabs, ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";

export function RequestsBoard({
  requests,
  filter,
  onFilter,
  onOpen,
}: {
  requests: RequestItem[];
  filter: "pending" | "assigned" | "all";
  onFilter: (value: "pending" | "assigned" | "all") => void;
  onOpen: (request: RequestItem) => void;
}) {
  const pending = requests.filter((item) => !item.assigned);
  const assigned = requests.filter((item) => item.assigned);
  const visible = requests.filter((item) =>
    filter === "all" ? true : filter === "assigned" ? item.assigned : !item.assigned,
  );

  return (
    <>
      <div className={styles.requestsToolbar}>
        <Tabs
          value={filter}
          onChange={(value) => onFilter(value as "pending" | "assigned" | "all")}
          tabs={[
            { value: "pending", label: "Ждут назначения", count: pending.length },
            { value: "assigned", label: "Назначены", count: assigned.length },
            { value: "all", label: "Все заявки", count: requests.length },
          ]}
        />
        <span className={ui.muted}>12 сентября · дневная смена</span>
      </div>
      {visible.length ? (
        <div className={styles.requestsGrid}>
          {visible.map((request) => (
            <RequestCard key={request.id} request={request} onOpen={() => onOpen(request)} />
          ))}
        </div>
      ) : (
        <div className={`${styles.panel} ${ui.empty}`}>
          <ClipboardList size={36} />
          <h3>{filter === "assigned" ? "Здесь появятся назначенные заявки" : "Все заявки распределены"}</h3>
          <p>
            {filter === "assigned"
              ? "Откройте заявку из очереди и выберите свободную технику."
              : "Новые задачи можно добавить кнопкой «Новая заявка»."}
          </p>
        </div>
      )}
    </>
  );
}
