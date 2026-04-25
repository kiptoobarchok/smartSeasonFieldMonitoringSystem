"use client";

import { useEffect, useState } from "react";
import {
  listFields,
  listFieldAgents,
  listAdminAgents,
  createField,
  updateField,
  deleteField,
} from "@/lib/api";
import type { Field, User } from "@/lib/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { Modal } from "@/components/shared/Modal";
import { FieldForm } from "@/components/fields/FieldForm";
import { useAdminAccess } from "@/lib/useAdminAccess";

export function FieldsManagementPage() {
  const { isChecking, isAdmin } = useAdminAccess();
  const [fields, setFields] = useState<Field[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [agentWorkloadById, setAgentWorkloadById] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!isAdmin) {
      return;
    }
    setLoading(true);
    try {
      const [fieldsData, agentsData, agentSummaries] = await Promise.all([
        listFields(),
        listFieldAgents(),
        listAdminAgents(),
      ]);
      setFields(fieldsData);
      setAgents(agentsData);
      setAgentWorkloadById(
        agentSummaries.reduce(
          (accumulator, agent) => {
            accumulator[agent.id] = agent.assigned_fields_count;
            return accumulator;
          },
          {} as Record<number, number>
        )
      );
      setError("");
    } catch {
      setError("Failed to load fields and agents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
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

  const handleCreateOrUpdate = async (payload: {
    name: string;
    crop_type: string;
    planting_date: string;
    assigned_agent: number;
  }) => {
    setSubmitting(true);
    try {
      if (editingField) {
        const updated = await updateField(editingField.id, payload);
        setFields((prev) =>
          prev.map((f) => (f.id === updated.id ? updated : f))
        );
      } else {
        const created = await createField(payload);
        setFields((prev) => [created, ...prev]);
      }
      setShowModal(false);
      setEditingField(null);
    } catch {
      // Error handled in form
      throw new Error("Failed to save field");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this field?")) {
      return;
    }

    try {
      await deleteField(id);
      setFields((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError("Failed to delete field.");
    }
  };

  const openCreateModal = () => {
    setEditingField(null);
    setShowModal(true);
  };

  const openEditModal = (field: Field) => {
    setEditingField(field);
    setShowModal(true);
  };

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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar items={sidebarItems} currentPath="/admin/fields" />

      <main className="ml-0 sm:ml-64 w-full">
        <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900">Field Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create, edit, and manage all field operations
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">
                Total Fields: <span className="font-semibold">{fields.length}</span>
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + Create Field
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-600">Loading fields...</p>
            </div>
          ) : fields.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">No fields yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Get started by creating your first field.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Create Field
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Field Name
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Crop Type
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Planted
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Current Stage
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {fields.map((field) => {
                    const statusColor = {
                      Completed: "text-emerald-600 bg-emerald-50",
                      "At Risk": "text-amber-600 bg-amber-50",
                      Active: "text-blue-600 bg-blue-50",
                    }[field.status];

                    return (
                      <tr key={field.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {field.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{field.crop_type}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(field.planting_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {field.current_stage}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
                          >
                            {field.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {field.assigned_agent_name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(field)}
                              className="inline-flex rounded px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(field.id)}
                              className="inline-flex rounded px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <Modal
        title={editingField ? "Edit Field" : "Create New Field"}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingField(null);
        }}
      >
        <FieldForm
          agents={agents}
          agentWorkloadById={agentWorkloadById}
          initialData={editingField || undefined}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setShowModal(false);
            setEditingField(null);
          }}
          isLoading={submitting}
        />
      </Modal>
    </div>
  );
}
