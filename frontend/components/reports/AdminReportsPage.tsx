"use client";

import { useEffect, useMemo, useState } from "react";

import { listAdminAgents, listFieldUpdates, listFields } from "@/lib/api";
import type { AgentLifecycleSummary, Field, FieldUpdate } from "@/lib/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAdminAccess } from "@/lib/useAdminAccess";

type RangeFilter = "7d" | "30d" | "all";

const sidebarItems = [
  {
    label: "Overview",
    href: "/admin/dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l-7-4m0 0l-2-3m2 3v10a1 1 0 001 1h4m-6-11l7-4 7 4" />
      </svg>
    ),
  },
  {
    label: "All Fields",
    href: "/admin/fields",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8 4m-8-4v10M7 15l3-2m0 0l3 2m-3-2v4" />
      </svg>
    ),
  },
  {
    label: "Field Agents",
    href: "/admin/agents",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-6-6 6 6 0 00-6 6v2" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

function getCutoffDate(filter: RangeFilter): Date | null {
  const now = new Date();
  if (filter === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (filter === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return null;
}

export function AdminReportsPage() {
  const { isChecking, isAdmin } = useAdminAccess();

  const [fields, setFields] = useState<Field[]>([]);
  const [agents, setAgents] = useState<AgentLifecycleSummary[]>([]);
  const [updates, setUpdates] = useState<FieldUpdate[]>([]);
  const [range, setRange] = useState<RangeFilter>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setError("");

    Promise.all([listFields(), listAdminAgents(), listFieldUpdates()])
      .then(([fieldsData, agentsData, updatesData]) => {
        setFields(fieldsData);
        setAgents(agentsData);
        setUpdates(updatesData);
      })
      .catch(() => setError("Failed to load reports data."))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const filteredUpdates = useMemo(() => {
    const cutoff = getCutoffDate(range);
    if (!cutoff) {
      return updates;
    }
    return updates.filter((update) => new Date(update.created_at) >= cutoff);
  }, [range, updates]);

  const kpis = useMemo(() => {
    const totalFields = fields.length;
    const activeFields = fields.filter((field) => field.status === "Active").length;
    const atRiskFields = fields.filter((field) => field.status === "At Risk").length;
    const completedFields = fields.filter((field) => field.status === "Completed").length;
    const activeAgents = agents.filter((agent) => agent.is_active).length;
    const avgFieldsPerActiveAgent = activeAgents > 0 ? totalFields / activeAgents : 0;
    const updatesWithoutNotes = filteredUpdates.filter((update) => !update.notes.trim()).length;

    return {
      totalFields,
      activeFields,
      atRiskFields,
      completedFields,
      activeRate: totalFields > 0 ? (activeFields / totalFields) * 100 : 0,
      activeAgents,
      avgFieldsPerActiveAgent,
      updateCount: filteredUpdates.length,
      updatesWithoutNotes,
    };
  }, [agents, fields, filteredUpdates]);

  const cropDistribution = useMemo(() => {
    const counts = fields.reduce((accumulator, field) => {
      accumulator[field.crop_type] = (accumulator[field.crop_type] || 0) + 1;
      return accumulator;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([crop, count]) => ({ crop, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [fields]);

  const statusDistribution = useMemo(() => {
    return {
      Active: kpis.activeFields,
      "At Risk": kpis.atRiskFields,
      Completed: kpis.completedFields,
    };
  }, [kpis.activeFields, kpis.atRiskFields, kpis.completedFields]);

  const topWorkloadAgents = useMemo(() => {
    return [...agents]
      .sort((a, b) => b.assigned_fields_count - a.assigned_fields_count)
      .slice(0, 8);
  }, [agents]);

  const latestQualityNotes = useMemo(() => {
    return [...filteredUpdates]
      .filter((update) => update.notes.trim().length > 0)
      .slice(0, 12);
  }, [filteredUpdates]);

  const maxCropCount = Math.max(...cropDistribution.map((item) => item.count), 1);
  const totalStatus = Math.max(kpis.totalFields, 1);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Checking admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={sidebarItems} currentPath="/admin/reports" />

      <main className="ml-0 w-full sm:ml-64">
        <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Operational Reports</h1>
              <p className="mt-1 text-sm text-slate-600">
                Executive analytics for field health, agent workload, and data quality.
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
              {(["7d", "30d", "all"] as RangeFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${
                    range === option
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {option === "all" ? "All time" : option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              Loading reports...
            </div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Total Fields" value={kpis.totalFields.toString()} accent="text-slate-900" />
                <KpiCard label="Active Rate" value={`${kpis.activeRate.toFixed(1)}%`} accent="text-blue-700" />
                <KpiCard label="At Risk Fields" value={kpis.atRiskFields.toString()} accent="text-amber-700" />
                <KpiCard label="Updates in Range" value={kpis.updateCount.toString()} accent="text-emerald-700" />
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Status Breakdown</h2>
                  <p className="mb-4 text-sm text-slate-500">Portfolio health across all fields.</p>
                  <div className="space-y-3">
                    {Object.entries(statusDistribution).map(([label, value]) => {
                      const width = (value / totalStatus) * 100;
                      const color =
                        label === "Active"
                          ? "bg-blue-500"
                          : label === "At Risk"
                            ? "bg-amber-500"
                            : "bg-emerald-500";

                      return (
                        <div key={label} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{label}</span>
                            <span className="text-slate-500">{value}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100">
                            <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Top Crops Distribution</h2>
                  <p className="mb-4 text-sm text-slate-500">Field allocation by crop type.</p>
                  <div className="space-y-3">
                    {cropDistribution.map((item) => {
                      const width = (item.count / maxCropCount) * 100;
                      return (
                        <div key={item.crop} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{item.crop}</span>
                            <span className="text-slate-500">{item.count}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-100">
                            <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {cropDistribution.length === 0 && (
                      <p className="text-sm text-slate-500">No crop data available.</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Agent Workload & Performance</h2>
                    <p className="text-sm text-slate-500">Allocation balance and risk burden per agent.</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Active Agents: {kpis.activeAgents}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-3 py-2">Agent</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Assigned</th>
                        <th className="px-3 py-2">At Risk</th>
                        <th className="px-3 py-2">Completed</th>
                        <th className="px-3 py-2">Updates</th>
                        <th className="px-3 py-2">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topWorkloadAgents.map((agent) => {
                        const completionRate =
                          agent.assigned_fields_count > 0
                            ? (agent.completed_fields_count / agent.assigned_fields_count) * 100
                            : 0;

                        return (
                          <tr key={agent.id} className="border-t border-slate-100">
                            <td className="px-3 py-3">
                              <p className="font-medium text-slate-900">
                                {agent.first_name} {agent.last_name}
                              </p>
                              <p className="text-xs text-slate-500">@{agent.username}</p>
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  agent.is_active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {agent.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-3 py-3">{agent.assigned_fields_count}</td>
                            <td className="px-3 py-3 text-amber-700">{agent.at_risk_fields_count}</td>
                            <td className="px-3 py-3 text-emerald-700">{agent.completed_fields_count}</td>
                            <td className="px-3 py-3">{agent.updates_count}</td>
                            <td className="px-3 py-3">{completionRate.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                      {topWorkloadAgents.length === 0 && (
                        <tr>
                          <td className="px-3 py-6 text-center text-slate-500" colSpan={7}>
                            No agent metrics available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Data Quality Signals</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Empty notes in selected range: {kpis.updatesWithoutNotes}
                  </p>

                  <div className="mt-4 space-y-3">
                    {latestQualityNotes.map((update) => (
                      <div key={update.id} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">
                            {update.agent_name} · {update.stage}
                          </p>
                          <span className="text-xs text-slate-500">
                            {new Date(update.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{update.notes}</p>
                      </div>
                    ))}
                    {latestQualityNotes.length === 0 && (
                      <p className="text-sm text-slate-500">No notes captured in this range.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Operational Summary</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    High-level planning aids for coordinator decisions.
                  </p>

                  <div className="mt-4 space-y-3 text-sm">
                    <SummaryRow label="Average Fields / Active Agent" value={kpis.avgFieldsPerActiveAgent.toFixed(2)} />
                    <SummaryRow label="Active Fields" value={`${kpis.activeFields} / ${kpis.totalFields}`} />
                    <SummaryRow label="Completed Fields" value={`${kpis.completedFields} / ${kpis.totalFields}`} />
                    <SummaryRow label="At Risk Fields" value={`${kpis.atRiskFields} / ${kpis.totalFields}`} />
                    <SummaryRow label="Report Time Range" value={range === "all" ? "All time" : range} />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
