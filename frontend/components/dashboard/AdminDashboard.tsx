"use client";

import { useEffect, useState } from "react";

import { getDashboardOverview } from "@/lib/api";
import type { DashboardResponse } from "@/lib/types";
import { AnalyticsOverview } from "@/components/dashboard/AnalyticsOverview";
import { PriorityNotifications } from "@/components/dashboard/PriorityNotifications";
import { FieldTable } from "@/components/dashboard/FieldTable";
import { RecentUpdates } from "@/components/dashboard/RecentUpdates";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAdminAccess } from "@/lib/useAdminAccess";

export function AdminDashboard() {
  const { isChecking, isAdmin } = useAdminAccess();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    getDashboardOverview()
      .then(setData)
      .catch(() => setError("Failed to load dashboard data."));
  }, [isAdmin]);

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

  if (error) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div className="ml-0 sm:ml-64 w-full p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div className="ml-0 sm:ml-64 w-full p-6">
          <p className="text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
      badge: 0,
    },
  ];

  const priorityAlerts = [
    ...(data.status_breakdown["At Risk"] > 0
      ? [
          {
            id: "at-risk-alert",
            level: "warning" as const,
            title: `${data.status_breakdown["At Risk"]} Field(s) at Risk`,
            message: "Fields without updates for more than 7 days require agent attention.",
            timestamp: new Date().toLocaleString(),
            action: {
              label: "View Fields",
              href: "/admin/fields?filter=at-risk",
            },
          },
        ]
      : []),
  ];

  const analyticsMetrics = [
    {
      label: "Total Fields",
      value: data.total_fields,
      color: "text-slate-900",
      trend: "stable" as const,
    },
    {
      label: "Active",
      value: data.status_breakdown.Active,
      color: "text-blue-600",
      trend: "up" as const,
      trendValue: "Healthy",
    },
    {
      label: "At Risk",
      value: data.status_breakdown["At Risk"],
      color: "text-amber-600",
      trend: data.status_breakdown["At Risk"] > 0 ? ("up" as const) : ("down" as const),
      trendValue: data.status_breakdown["At Risk"] > 0 ? "Monitor" : "None",
    },
    {
      label: "Completed",
      value: data.status_breakdown.Completed,
      color: "text-emerald-600",
      trend: "up" as const,
      trendValue: "Harvested",
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={sidebarItems} currentPath="/admin/dashboard" />

      <main className="ml-0 sm:ml-64 w-full">
        <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor all field operations and agent performance
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Analytics Overview */}
          <AnalyticsOverview metrics={analyticsMetrics} />

          {/* Priority Notifications */}
          <PriorityNotifications alerts={priorityAlerts} />

          {/* Fields Table */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Field Inventory</h2>
              <p className="text-sm text-slate-600">All tracked fields and their current status</p>
            </div>
            <FieldTable fields={data.fields} />
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-sm text-slate-600">Latest field updates from agents</p>
            </div>
            <RecentUpdates updates={data.recent_updates} />
          </div>
        </div>
      </main>
    </div>
  );
}
