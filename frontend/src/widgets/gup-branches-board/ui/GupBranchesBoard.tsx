"use client";

import { useState } from "react";
import { Building2, ClipboardList, Truck } from "lucide-react";
import type { Branch, GarageSnapshot } from "@/entities/garage";
import { RequestCard, type RequestItem } from "@/entities/request";
import { StatusBadge, countByStatus } from "@/entities/vehicle";
import { ui } from "@/shared/ui";
import panelStyles from "@/shared/styles/panels.module.css";

function branchStats(snapshot: GarageSnapshot, branch: Branch) {
  const fleet = snapshot.fleet.filter((item) => item.branchId === branch.id);
  const requests = snapshot.requests.filter((item) => item.branchId === branch.id);
  const pending = requests.filter((item) => !item.assigned).length;
  const assigned = requests.filter((item) => item.assigned).length;
  const status = countByStatus(fleet);
  return { fleet, requests, pending, assigned, status };
}

export function GupBranchesBoard({
  snapshot,
  onOpenRequest,
}: {
  snapshot: GarageSnapshot;
  onOpenRequest: (request: RequestItem) => void;
}) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const selectedBranch =
    snapshot.branches.find((item) => item.id === selectedBranchId) ?? null;
  const selected = selectedBranch ? branchStats(snapshot, selectedBranch) : null;

  return (
    <>
      <div className={panelStyles.gupGrid}>
        {snapshot.branches.map((branch) => {
          const stats = branchStats(snapshot, branch);
          const active = selectedBranchId === branch.id;
          return (
            <button
              key={branch.id}
              type="button"
              className={`${panelStyles.gupCard} ${active ? panelStyles.gupCardActive : ""}`}
              onClick={() => setSelectedBranchId(branch.id)}
            >
              <header>
                <Building2 size={18} />
                <strong>{branch.name}</strong>
              </header>
              <dl>
                <div>
                  <dt>В очереди</dt>
                  <dd>{stats.pending}</dd>
                </div>
                <div>
                  <dt>Назначены</dt>
                  <dd>{stats.assigned}</dd>
                </div>
                <div>
                  <dt>На объекте</dt>
                  <dd>{stats.status.working}</dd>
                </div>
                <div>
                  <dt>Свободны</dt>
                  <dd>{stats.status.ready}</dd>
                </div>
                <div>
                  <dt>ТО</dt>
                  <dd>{stats.status.service}</dd>
                </div>
                <div>
                  <dt>Парк</dt>
                  <dd>{stats.fleet.length}</dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>

      {selectedBranch && selected && (
        <section className={panelStyles.gupDetail}>
          <div className={panelStyles.requestsToolbar}>
            <h2>{selectedBranch.name}</h2>
            <span className={ui.muted}>{selectedBranch.address}</span>
          </div>

          <h3 className={panelStyles.gupSectionTitle}>
            <ClipboardList size={16} /> Заявки филиала
          </h3>
          {selected.requests.length ? (
            <div className={panelStyles.requestsGrid}>
              {selected.requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onOpen={() => onOpenRequest(request)}
                />
              ))}
            </div>
          ) : (
            <p className={ui.muted}>Заявок нет.</p>
          )}

          <h3 className={panelStyles.gupSectionTitle}>
            <Truck size={16} /> Парк филиала
          </h3>
          {selected.fleet.length ? (
            <div className={panelStyles.simpleTableWrap}>
              <table className={panelStyles.simpleTable}>
                <thead>
                  <tr>
                    <th>Техника</th>
                    <th>Водитель</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.fleet.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <strong>{vehicle.name}</strong>
                        <div className={ui.muted}>{vehicle.plate}</div>
                      </td>
                      <td>{vehicle.driver}</td>
                      <td>
                        <StatusBadge status={vehicle.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={ui.muted}>Техники нет.</p>
          )}
        </section>
      )}
    </>
  );
}
