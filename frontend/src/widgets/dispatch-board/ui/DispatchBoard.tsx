import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  ClipboardList,
  Clock3,
  Gauge,
  Plus,
  SlidersHorizontal,
  Truck,
  Wrench,
} from "lucide-react";
import type { Job } from "@/entities/garage";
import { RequestCard, type RequestItem } from "@/entities/request";
import { FleetTable, STATUS, VehicleIcon, type Status, type Vehicle } from "@/entities/vehicle";
import { cx, formatTime, shortName } from "@/shared/lib";
import { Tabs, ui } from "@/shared/ui";
import styles from "./dispatch.module.css";

const HOURS = [8, 10, 12, 14, 16, 18, 20];

export function DispatchBoard({
  fleet,
  jobs,
  requests,
  events,
  allSchedule,
  scheduleMode,
  onAllSchedule,
  onScheduleMode,
  onOpenFleet,
  onOpenService,
  onOpenRequests,
  onSelect,
  onAssign,
  onOpenEvents,
}: {
  fleet: Vehicle[];
  jobs: Job[];
  requests: RequestItem[];
  events: { time: string; title: string; detail: string; type: string }[];
  allSchedule: boolean;
  scheduleMode: string;
  onAllSchedule: (value: boolean) => void;
  onScheduleMode: (value: string) => void;
  onOpenFleet: (filter?: Status) => void;
  onOpenService: () => void;
  onOpenRequests: () => void;
  onSelect: (id: string) => void;
  onAssign: (request: RequestItem, preferred?: string) => void;
  onOpenEvents: () => void;
}) {
  const counts = {
    working: fleet.filter((item) => item.status === "working").length,
    ready: fleet.filter((item) => item.status === "ready").length,
    reserved: fleet.filter((item) => item.status === "reserved").length,
    service: fleet.filter((item) => item.status === "service").length,
  };
  const pending = requests.filter((item) => !item.assigned);
  const operable = fleet.length - counts.service;
  const load = operable === 0 ? 0 : Math.round((counts.working / operable) * 100);
  const visibleFleet = allSchedule ? fleet : fleet.slice(0, 6);

  return (
    <>
      <section className={styles.metrics} aria-label="Состояние парка на 10:45">
        <button className={styles.metric} onClick={() => onOpenFleet()}>
          <div className={styles.metricTop}>
            <span>Всего в парке</span>
            <Truck size={18} />
          </div>
          <div className={styles.metricNumber}>
            {fleet.length.toString().padStart(2, "0")}
            <span>единиц</span>
          </div>
          <div className={styles.metricBottom}>
            <span className={styles.miniChart}>
              {fleet.map((vehicle) => (
                <i
                  key={vehicle.id}
                  className={
                    vehicle.status === "working"
                      ? styles.miniWorking
                      : vehicle.status === "ready"
                        ? styles.miniReady
                        : vehicle.status === "service"
                          ? styles.miniService
                          : styles.miniReserved
                  }
                />
              ))}
            </span>
            <span>Основной гараж</span>
          </div>
        </button>
        <button className={styles.metric} onClick={() => onOpenFleet("working")}>
          <div className={styles.metricTop}>
            <span>На объектах</span>
            <ArrowUpRight size={19} />
          </div>
          <div className={styles.metricNumber}>
            {counts.working.toString().padStart(2, "0")}
            <span className={cx(styles.metricState, styles.workingState)}>В работе</span>
          </div>
          <div className={styles.metricBottom}>
            <span className={styles.indicator} />
            По плану смены
          </div>
        </button>
        <button className={styles.metric} onClick={() => onOpenFleet("ready")}>
          <div className={styles.metricTop}>
            <span>Готовы к выезду</span>
            <CheckCheck size={19} />
          </div>
          <div className={styles.metricNumber}>
            {counts.ready.toString().padStart(2, "0")}
            <span>свободны</span>
          </div>
          <div className={styles.metricBottom}>
            <span className={cx(styles.indicator, styles.indicatorReady)} />
            Ещё {counts.reserved} в резерве
          </div>
        </button>
        <button className={styles.metric} onClick={onOpenService}>
          <div className={styles.metricTop}>
            <span>На обслуживании</span>
            <Wrench size={18} />
          </div>
          <div className={styles.metricNumber}>
            {counts.service.toString().padStart(2, "0")}
            <span className={cx(styles.metricState, styles.serviceState)}>Плановое ТО</span>
          </div>
          <div className={styles.metricBottom}>
            <span className={cx(styles.indicator, styles.indicatorService)} />
            {counts.service ? "Возвращение по готовности" : "Вся техника в строю"}
          </div>
        </button>
      </section>

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className={styles.panel}>
            <div className={styles.heading}>
              <div>
                <div className={styles.eyebrow}>ПЛАН РАБОТ</div>
                <h2>
                  Движение смены <span className={styles.count}>{fleet.length}</span>
                </h2>
              </div>
              <Tabs
                compact
                value={scheduleMode}
                onChange={onScheduleMode}
                tabs={[
                  { value: "timeline", label: "Шкала" },
                  { value: "list", label: "Список" },
                ]}
              />
            </div>
            <div className={styles.toolbar}>
              <span className={styles.date}>
                <CalendarDays size={15} />
                <b>12 сентября</b>
                <span>Суббота</span>
              </span>
              <button
                className={cx(styles.filter, allSchedule && styles.filterOn)}
                onClick={() => onAllSchedule(!allSchedule)}
              >
                <SlidersHorizontal size={14} />
                {allSchedule ? "Весь парк" : "В фокусе · 6 из 12"}
                <ChevronRight size={14} />
              </button>
            </div>

            {scheduleMode === "timeline" ? (
              <div className={styles.scheduleScroll}>
                <div className={styles.schedule} role="region" aria-label="Расписание техники с 8 до 20 часов">
                  <div className={styles.scheduleHeader}>
                    <span>ТЕХНИКА / ЭКИПАЖ</span>
                    <div className={styles.hours}>
                      {HOURS.map((hour) => (
                        <span key={hour}>{formatTime(hour)}</span>
                      ))}
                      <span className={styles.nowTag}>10:45</span>
                    </div>
                  </div>
                  {visibleFleet.map((vehicle) => (
                    <div className={styles.row} key={vehicle.id}>
                      <button className={styles.vehicle} onClick={() => onSelect(vehicle.id)}>
                        <VehicleIcon category={vehicle.category} status={vehicle.status} />
                        <span>
                          <strong>{vehicle.name}</strong>
                          <small>{shortName(vehicle.driver)}</small>
                        </span>
                        <span
                          className={cx(
                            styles.rowStatus,
                            vehicle.status === "working" && styles.statusWorking,
                            vehicle.status === "ready" && styles.statusReady,
                            vehicle.status === "reserved" && styles.statusReserved,
                            vehicle.status === "service" && styles.statusService,
                          )}
                          aria-label={STATUS[vehicle.status].label}
                        />
                      </button>
                      <div className={styles.track}>
                        <div className={styles.nowLine} />
                        {jobs
                          .filter((job) => job.vehicle === vehicle.id)
                          .map((job) => (
                            <button
                              key={job.id}
                              className={cx(
                                styles.job,
                                job.tone === "blue" && styles.jobBlue,
                                job.tone === "reserved" && styles.jobReserved,
                                job.tone === "lime" && styles.jobLime,
                              )}
                              style={{
                                left: `${((job.start - 8) / 12) * 100}%`,
                                width: `${((job.end - job.start) / 12) * 100}%`,
                              }}
                              onClick={() => onSelect(vehicle.id)}
                              aria-label={`${vehicle.name}: ${job.title}, ${formatTime(job.start)}–${formatTime(job.end)}`}
                            >
                              <span className={styles.jobTitle}>
                                {job.tone === "reserved" && <Clock3 size={12} />}
                                <span>{job.title}</span>
                              </span>
                              <span className={styles.jobMeta}>
                                {formatTime(job.start)}–{formatTime(job.end)}
                                <span>№ {job.id}</span>
                              </span>
                            </button>
                          ))}
                        {vehicle.status === "ready" && (
                          <button
                            className={styles.freeTrack}
                            onClick={() => {
                              const request = pending.find((item) => item.category === vehicle.category);
                              if (request) onAssign(request, vehicle.id);
                              else onSelect(vehicle.id);
                            }}
                          >
                            <Plus size={14} />
                            Свободна для новой задачи
                          </button>
                        )}
                        {vehicle.status === "service" && (
                          <button className={styles.serviceTrack} onClick={() => onSelect(vehicle.id)}>
                            <Wrench size={14} />
                            <strong>Плановое обслуживание</strong>
                            <span>ТО · {vehicle.hours} м/ч</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <FleetTable vehicles={visibleFleet} onSelect={onSelect} />
            )}

            <div className={styles.footer}>
              <div className={styles.legend}>
                <span>
                  <i className={styles.lime} />
                  На объекте
                </span>
                <span>
                  <i className={styles.reserved} />
                  Резерв
                </span>
                <span>
                  <i className={styles.service} />
                  Обслуживание
                </span>
              </div>
              <button onClick={() => onAllSchedule(!allSchedule)}>
                {allSchedule ? "Свернуть парк" : "Вся техника"}
                <ArrowRight size={15} />
              </button>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={cx(styles.heading, styles.activityHeading)}>
              <h2>
                Пульс гаража <span className={styles.activityTime}>на 10:45</span>
              </h2>
              <button className={ui.textButton} onClick={onOpenEvents}>
                Все события <ArrowUpRight size={15} />
              </button>
            </div>
            <div className={styles.activityList}>
              {events.slice(0, 3).map((event, index) => (
                <div className={styles.activityItem} key={`${event.title}-${index}`}>
                  <span
                    className={cx(
                      styles.activityIcon,
                      event.type === "request" && styles.activityRequest,
                      event.type === "arrival" && styles.activityArrival,
                    )}
                  >
                    {event.type === "arrival" ? (
                      <ArrowDownLeft size={17} />
                    ) : event.type === "request" ? (
                      <ClipboardList size={16} />
                    ) : (
                      <Check size={17} />
                    )}
                  </span>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </div>
                  <time>{event.time}</time>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.rail}>
          <section className={styles.loadCard}>
            <div className={styles.loadTop}>
              <span>
                <Gauge size={17} />
                Загрузка парка
              </span>
              <span className={styles.darkLabel}>СМЕНА 01</span>
            </div>
            <div className={styles.gauge}>
              <svg viewBox="0 0 280 160" role="img" aria-label={`Загрузка исправного парка ${load} процентов`}>
                {Array.from({ length: 41 }, (_, index) => {
                  const angle = ((180 + index * 4.5) * Math.PI) / 180;
                  return (
                    <line
                      key={index}
                      x1={140 + 105 * Math.cos(angle)}
                      y1={136 + 105 * Math.sin(angle)}
                      x2={140 + 124 * Math.cos(angle)}
                      y2={136 + 124 * Math.sin(angle)}
                      stroke={index / 40 < load / 100 ? "#d5f778" : "#454b42"}
                      strokeWidth="3.4"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className={styles.loadNumber}>
                {load}
                <span>%</span>
                <small>исправной техники в работе</small>
              </div>
            </div>
            <div className={styles.loadInfo}>
              <span>
                <i />
                {counts.working} на объектах
              </span>
              <span>{fleet.length - counts.service} исправны</span>
            </div>
            <div className={styles.loadBottom}>
              <span className={styles.loadArrow}>
                <ArrowUpRight size={20} />
              </span>
              <p>
                {counts.ready ? (
                  <>
                    <b>
                      {counts.ready} {counts.ready === 1 ? "единица готова" : "единицы готовы"} к выезду
                    </b>
                    <br />
                    Можно распределить новые заявки
                  </>
                ) : (
                  <>
                    <b>Свободная техника распределена</b>
                    <br />
                    Следите за возвращением в гараж
                  </>
                )}
              </p>
            </div>
          </section>

          <section>
            <div className={styles.queueHeading}>
              <h2>
                Ждут назначения <span>{pending.length}</span>
              </h2>
              <button className={ui.iconButton} onClick={onOpenRequests} aria-label="Все заявки">
                <ArrowUpRight size={18} />
              </button>
            </div>
            {pending.slice(0, 3).map((request) => (
              <RequestCard key={request.id} request={request} onOpen={() => onAssign(request)} />
            ))}
            {pending.length === 0 && (
              <div className={cx(ui.empty, ui.emptySmall)}>
                <CheckCheck size={28} />
                <h3>Всё распределено</h3>
                <p>У каждой заявки есть техника и экипаж.</p>
              </div>
            )}
            {pending.length > 3 && (
              <button className={styles.allRequests} onClick={onOpenRequests}>
                Ещё заявок: {pending.length - 3} <ArrowRight size={15} />
              </button>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
