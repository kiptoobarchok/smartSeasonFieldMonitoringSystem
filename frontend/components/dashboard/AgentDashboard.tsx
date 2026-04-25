"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { createFieldUpdate, getDashboardOverview } from "@/lib/api";
import type { DashboardResponse, Field } from "@/lib/types";
import { AnalyticsOverview } from "@/components/dashboard/AnalyticsOverview";
import { PriorityNotifications } from "@/components/dashboard/PriorityNotifications";
import { FieldTable } from "@/components/dashboard/FieldTable";
import { RecentUpdates } from "@/components/dashboard/RecentUpdates";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAgentAccess } from "@/lib/useAgentAccess";

const STAGES = ["Planted", "Growing", "Ready", "Harvested"] as const;

export function AgentDashboard() {
  const { isChecking, isAgent } = useAgentAccess();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [selectedField, setSelectedField] = useState<number | "">("");
  const [selectedStage, setSelectedStage] = useState<(typeof STAGES)[number]>("Growing");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const loadDashboard = async () => {
    try {
      const result = await getDashboardOverview();
      setData(result);
      if (result.fields.length > 0 && selectedField === "") {
        setSelectedField(result.fields[0].id);
      }
    } catch {
      setError("Failed to load dashboard data.");
    }
  };

  useEffect(() => {
    if (isAgent) {
      loadDashboard();
    }
  }, [isAgent]);

  const fields = useMemo(() => data?.fields ?? [], [data]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedField === "") {
      return;
    }

    setSaving(true);
    try {
      await createFieldUpdate({
        field: selectedField,
        stage: selectedStage,
        notes,
      });
      setNotes("");
      await loadDashboard();
    } catch {
      setError("Could not submit field update.");
    } finally {
      setSaving(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Checking agent access...</p>
      </div>
    );
  }

  if (!isAgent) {
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar items={sidebarItems} currentPath="/agent/dashboard" />
        <main className="ml-0 w-full p-6 sm:ml-64">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar items={sidebarItems} currentPath="/agent/dashboard" />
        <main className="ml-0 w-full p-6 sm:ml-64">
          <p className="text-sm text-slate-600">Loading dashboard...</p>
        </main>
      </div>
    );
  }

  const analyticsMetrics = [
    {
      label: "Assigned Fields",
      value: data.total_fields,
      color: "text-slate-900",
      trend: "stable" as const,
      trendValue: "Current",
    },
    {
      label: "Active",
      value: data.status_breakdown.Active,
      color: "text-blue-600",
      trend: "up" as const,
      trendValue: "On track",
    },
    {
      label: "At Risk",
      value: data.status_breakdown["At Risk"],
      color: "text-amber-600",
      trend: data.status_breakdown["At Risk"] > 0 ? ("up" as const) : ("down" as const),
      trendValue: data.status_breakdown["At Risk"] > 0 ? "Needs action" : "Clear",
    },
    {
      label: "Completed",
      value: data.status_breakdown.Completed,
      color: "text-emerald-600",
      trend: "up" as const,
      trendValue: "Harvested",
    },
  ];

  const alerts = [
    ...(data.status_breakdown["At Risk"] > 0
      ? [
          {
            id: "agent-at-risk",
            level: "warning" as const,
            title: `${data.status_breakdown["At Risk"]} field(s) need attention`,
            message: "Prioritize updates for stale fields to bring them back to Active status.",
            timestamp: new Date().toLocaleString(),
            action: {
              label: "Review My Fields",
              href: "/agent/dashboard",
            },
          },
        ]
      : [
          {
            id: "agent-good",
            level: "info" as const,
            title: "Great progress",
            message: "All assigned fields are currently active or completed.",
            timestamp: new Date().toLocaleString(),
          },
        ]),
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={sidebarItems} currentPath="/agent/dashboard" />

      <main className="ml-0 w-full sm:ml-64">
        <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl font-bold text-slate-900">Field Agent Workspace</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track your assigned fields, submit updates, and keep operations healthy.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <AnalyticsOverview metrics={analyticsMetrics} />

          <PriorityNotifications alerts={alerts} />

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Submit Field Update</h2>
              <p className="text-sm text-slate-500">
                Capture the latest stage progress and optional field notes.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  className="rounded-md border border-slate-300 px-3 py-2"
                  value={selectedField}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedField(Number(event.target.value))
                  }
                  required
                >
                  {fields.map((field: Field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-md border border-slate-300 px-3 py-2"
                  value={selectedStage}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedStage(event.target.value as (typeof STAGES)[number])
                  }
                >
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-md border border-slate-300 px-3 py-2"
                  placeholder="Optional note"
                  value={notes}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setNotes(event.target.value)
                  }
                />
              </div>

              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Update"}
              </button>
            </form>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">My Fields</h2>
              <p className="text-sm text-slate-600">Current status of all assigned fields.</p>
            </div>
            <FieldTable fields={data.fields} />
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-sm text-slate-600">Your latest submitted updates and notes.</p>
            </div>
            <RecentUpdates updates={data.recent_updates} />
          </section>
        </div>
      </main>
    </div>
  );
}

const sidebarItems = [
  {
    label: "Workspace",
    href: "/agent/dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l-7-4m0 0l-2-3m2 3v10a1 1 0 001 1h4m-6-11l7-4 7 4" />
      </svg>
    ),
  },
];
