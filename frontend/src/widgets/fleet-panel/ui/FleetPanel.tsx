import { Search } from "lucide-react";
import { FleetTable, type Status, type Vehicle } from "@/entities/vehicle";
import { Tabs, ui } from "@/shared/ui";
import styles from "@/shared/styles/panels.module.css";

export function FleetPanel({
  fleet,
  filter,
  query,
  onFilter,
  onQuery,
  onSelect,
}: {
  fleet: Vehicle[];
  filter: "all" | Status;
  query: string;
  onFilter: (value: "all" | Status) => void;
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  const counts = {
    all: fleet.length,
    working: fleet.filter((item) => item.status === "working").length,
    ready: fleet.filter((item) => item.status === "ready").length,
    reserved: fleet.filter((item) => item.status === "reserved").length,
    service: fleet.filter((item) => item.status === "service").length,
  };
  const filtered = fleet.filter(
    (vehicle) =>
      (filter === "all" || vehicle.status === filter) &&
      `${vehicle.name} ${vehicle.driver} ${vehicle.plate} ${vehicle.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <Tabs
          value={filter}
          onChange={(value) => onFilter(value as "all" | Status)}
          tabs={[
            { value: "all", label: "Вся техника", count: counts.all },
            { value: "working", label: "В работе", count: counts.working },
            { value: "ready", label: "Свободна", count: counts.ready },
            { value: "reserved", label: "Резерв", count: counts.reserved },
            { value: "service", label: "Сервис", count: counts.service },
          ]}
        />
        <label className={styles.search}>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Техника, номер, водитель"
            aria-label="Поиск по парку"
          />
        </label>
      </div>
      {filtered.length ? (
        <FleetTable vehicles={filtered} onSelect={onSelect} />
      ) : (
        <div className={ui.empty}>
          <Search size={32} />
          <h3>Техника не найдена</h3>
          <p>Попробуйте другое название или измените фильтр.</p>
          <button
            className={ui.secondaryButton}
            onClick={() => {
              onQuery("");
              onFilter("all");
            }}
          >
            Показать весь парк
          </button>
        </div>
      )}
      <div className={styles.summary}>
        {filtered.length} из {fleet.length} единиц · состояние на 12 сентября, 10:45
      </div>
    </section>
  );
}
