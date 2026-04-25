"use client";

import { AxiosError } from "axios";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import {
  createAgentAccount,
  getAgentAuditFeed,
  getDashboardOverview,
  listAdminAgents,
  listFields,
  setAgentStatus,
  updateField,
} from "@/lib/api";
import type {
  AgentLifecycleSummary,
  AgentProvisionPayload,
  Field,
  FieldUpdate,
} from "@/lib/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { Modal } from "@/components/shared/Modal";
import { useAdminAccess } from "@/lib/useAdminAccess";

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

const initialFormState: AgentProvisionPayload = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
};

export function AgentsManagementPage() {
  const { isChecking, isAdmin } = useAdminAccess();
  const [agents, setAgents] = useState<AgentLifecycleSummary[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [globalUpdates, setGlobalUpdates] = useState<FieldUpdate[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedAgentUpdates, setSelectedAgentUpdates] = useState<FieldUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [formData, setFormData] = useState<AgentProvisionPayload>(initialFormState);
  const [savingAgent, setSavingAgent] = useState(false);
  const [formError, setFormError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  const [reassignTargetByField, setReassignTargetByField] = useState<Record<number, number>>({});
  const [reassigningFieldId, setReassigningFieldId] = useState<number | null>(null);

  const loadData = async () => {
    if (!isAdmin) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [agentsData, fieldsData, dashboardData] = await Promise.all([
        listAdminAgents(),
        listFields(),
        getDashboardOverview(),
      ]);
      setAgents(agentsData);
      setFields(fieldsData);
      setGlobalUpdates(dashboardData.recent_updates);

      if (agentsData.length > 0) {
        const fallbackAgentId = selectedAgentId ?? agentsData[0].id;
        setSelectedAgentId(fallbackAgentId);
      } else {
        setSelectedAgentId(null);
      }
    } catch {
      setError("Failed to load agent management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedAgentId) {
      setSelectedAgentUpdates([]);
      return;
    }

    getAgentAuditFeed(selectedAgentId)
      .then((updates) => setSelectedAgentUpdates(updates))
      .catch(() => setSelectedAgentUpdates([]));
  }, [selectedAgentId]);

  const activeAgents = useMemo(
    () => agents.filter((agent) => agent.is_active),
    [agents]
  );

  const atRiskFields = useMemo(
    () => fields.filter((field) => field.status === "At Risk"),
    [fields]
  );

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const topRiskAgents = useMemo(
    () => [...agents].sort((a, b) => b.at_risk_fields_count - a.at_risk_fields_count).slice(0, 3),
    [agents]
  );

  const totalAssignedFields = useMemo(
    () => agents.reduce((sum, agent) => sum + agent.assigned_fields_count, 0),
    [agents]
  );

  const handleProvisionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAgent(true);
    setFormError("");
    setSuccessNotice("");
    setError("");
    try {
      await createAgentAccount(formData);
      setSuccessNotice(
        `Agent account created and synced. Credentials ready: ${formData.username} / ${formData.password}`
      );
      setShowProvisionModal(false);
      setFormData(initialFormState);
      await loadData();
    } catch (requestError: unknown) {
      const apiError = requestError as AxiosError<Record<string, string[] | string>>;
      const responseData = apiError.response?.data;

      if (responseData && typeof responseData === "object") {
        const flattened = Object.entries(responseData)
          .map(([field, value]) => {
            if (Array.isArray(value)) {
              return `${field}: ${value.join(" ")}`;
            }
            return `${field}: ${value}`;
          })
          .join(" | ");

        setFormError(flattened || "Failed to create agent account.");
      } else {
        setFormError("Failed to create agent account. Check provided credentials.");
      }
    } finally {
      setSavingAgent(false);
    }
  };

  const handleToggleAgentStatus = async (agent: AgentLifecycleSummary) => {
    try {
      await setAgentStatus(agent.id, !agent.is_active);
      await loadData();
    } catch {
      setError("Failed to update agent status.");
    }
  };

  const handleReassignField = async (field: Field) => {
    const targetAgentId = reassignTargetByField[field.id];
    if (!targetAgentId || targetAgentId === field.assigned_agent) {
      return;
    }

    setReassigningFieldId(field.id);
    setError("");
    try {
      await updateField(field.id, { assigned_agent: targetAgentId });
      await loadData();
    } catch {
      setError("Failed to reassign field.");
    } finally {
      setReassigningFieldId(null);
    }
  };

  if (loading) {
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
        <Sidebar items={sidebarItems} currentPath="/admin/agents" />
        <main className="ml-0 w-full p-6 sm:ml-64">
          <p className="text-sm text-slate-600">Loading agent management...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={sidebarItems} currentPath="/admin/agents" />

      <main className="ml-0 w-full sm:ml-64">
        <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl font-bold text-slate-900">Agent Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Provision agents, balance workload, and monitor update quality.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {successNotice && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {successNotice}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Agents" value={agents.length} accent="text-slate-900" />
            <MetricCard label="Active Agents" value={activeAgents.length} accent="text-emerald-600" />
            <MetricCard label="Inactive Agents" value={agents.length - activeAgents.length} accent="text-red-600" />
            <MetricCard label="Assigned Fields" value={totalAssignedFields} accent="text-blue-600" />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Provision & Lifecycle</h2>
              <button
                type="button"
                onClick={() => setShowProvisionModal(true)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + New Field Agent
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2">Agent</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Assigned</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">At Risk</th>
                    <th className="px-3 py-2">Completed</th>
                    <th className="px-3 py-2">Updates</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
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
                      <td className="px-3 py-3 text-blue-700">{agent.active_fields_count}</td>
                      <td className="px-3 py-3 text-amber-700">{agent.at_risk_fields_count}</td>
                      <td className="px-3 py-3 text-emerald-700">{agent.completed_fields_count}</td>
                      <td className="px-3 py-3">{agent.updates_count}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAgentStatus(agent)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {agent.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {agents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                        No agents available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Workload Reassignment</h2>
              <p className="mb-3 text-sm text-slate-500">
                Reassign At Risk fields to available active agents.
              </p>
              <div className="space-y-3">
                {atRiskFields.map((field) => (
                  <div key={field.id} className="rounded-lg border border-slate-100 p-3">
                    <p className="font-medium text-slate-900">{field.name}</p>
                    <p className="text-xs text-slate-500">
                      Current: {field.assigned_agent_name || "Unassigned"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                        value={reassignTargetByField[field.id] ?? ""}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                          setReassignTargetByField((prev) => ({
                            ...prev,
                            [field.id]: Number(event.target.value),
                          }))
                        }
                      >
                        <option value="">Select target agent</option>
                        {activeAgents
                          .filter((agent) => agent.id !== field.assigned_agent)
                          .map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.first_name} {agent.last_name} ({agent.assigned_fields_count} fields)
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleReassignField(field)}
                        disabled={reassigningFieldId === field.id}
                        className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {reassigningFieldId === field.id ? "Saving..." : "Reassign"}
                      </button>
                    </div>
                  </div>
                ))}
                {atRiskFields.length === 0 && (
                  <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    No At Risk fields. Workload is currently balanced.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Performance Insights</h2>
              <p className="mb-3 text-sm text-slate-500">
                Agents currently driving the highest At Risk counts.
              </p>
              <div className="space-y-2">
                {topRiskAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {agent.first_name} {agent.last_name}
                      </p>
                      <p className="text-xs text-slate-500">@{agent.username}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                      {agent.at_risk_fields_count} at risk
                    </span>
                  </div>
                ))}
                {topRiskAgents.length === 0 && (
                  <p className="text-sm text-slate-500">No agent performance data available.</p>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Agent Audit Trail</h2>
                <select
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={selectedAgentId ?? ""}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedAgentId(Number(event.target.value))
                  }
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                {selectedAgentUpdates.map((update) => (
                  <div key={update.id} className="rounded-md border border-slate-100 p-2">
                    <p className="text-sm font-medium text-slate-900">Field #{update.field} — {update.stage}</p>
                    <p className="text-xs text-slate-500">{new Date(update.created_at).toLocaleString()}</p>
                    <p className="mt-1 text-sm text-slate-700">{update.notes || "No notes"}</p>
                  </div>
                ))}
                {selectedAgent && selectedAgentUpdates.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No updates for {selectedAgent.first_name} {selectedAgent.last_name}.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Global Update Feed</h2>
              <p className="mb-3 text-sm text-slate-500">
                Cross-agent observations for admin oversight and note quality review.
              </p>
              <div className="space-y-2">
                {globalUpdates.map((update) => (
                  <div key={update.id} className="rounded-md border border-slate-100 p-2">
                    <p className="text-sm font-medium text-slate-900">{update.agent_name} — {update.stage}</p>
                    <p className="text-xs text-slate-500">{new Date(update.created_at).toLocaleString()}</p>
                    <p className="mt-1 text-sm text-slate-700">{update.notes || "No notes"}</p>
                  </div>
                ))}
                {globalUpdates.length === 0 && (
                  <p className="text-sm text-slate-500">No recent updates available.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Modal
        title="Create Field Agent Account"
        isOpen={showProvisionModal}
        onClose={() => {
          setShowProvisionModal(false);
          setFormData(initialFormState);
          setFormError("");
        }}
      >
        <form className="space-y-3" onSubmit={handleProvisionSubmit}>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Username"
            value={formData.username}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, username: event.target.value }))
            }
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, email: event.target.value }))
            }
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="First name"
              value={formData.first_name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, first_name: event.target.value }))
              }
              required
            />
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Last name"
              value={formData.last_name}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, last_name: event.target.value }))
              }
              required
            />
          </div>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="password"
            placeholder="Initial password"
            value={formData.password}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, password: event.target.value }))
            }
            required
            minLength={8}
          />

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={savingAgent}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {savingAgent ? "Creating..." : "Create Agent"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
