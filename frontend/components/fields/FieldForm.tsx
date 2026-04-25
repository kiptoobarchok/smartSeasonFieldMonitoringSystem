import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import type { Field, User } from "@/lib/types";

interface FieldFormProps {
  agents: User[];
  agentWorkloadById?: Record<number, number>;
  initialData?: Field;
  onSubmit: (payload: {
    name: string;
    crop_type: string;
    planting_date: string;
    assigned_agent: number;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const CROP_TYPES = [
  "Maize",
  "Beans",
  "Wheat",
  "Rice",
  "Potatoes",
  "Tomatoes",
  "Cabbage",
  "Carrots",
  "Onions",
  "Other",
];

export function FieldForm({
  agents,
  agentWorkloadById,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: FieldFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [cropType, setCropType] = useState(initialData?.crop_type || "");
  const [plantingDate, setPlantingDate] = useState(
    initialData?.planting_date || ""
  );
  const [assignedAgent, setAssignedAgent] = useState(
    initialData?.assigned_agent?.toString() || ""
  );
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !cropType.trim() || !plantingDate || !assignedAgent) {
      setError("All fields are required.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        crop_type: cropType.trim(),
        planting_date: plantingDate,
        assigned_agent: parseInt(assignedAgent, 10),
      });
    } catch (err) {
      setError("Failed to save field. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Field Name
        </label>
        <input
          id="name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="e.g., North Plot"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setName(event.target.value)
          }
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="crop" className="text-sm font-medium text-slate-700">
          Crop Type
        </label>
        <select
          id="crop"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={cropType}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setCropType(event.target.value)
          }
          required
        >
          <option value="">Select a crop type</option>
          {CROP_TYPES.map((crop) => (
            <option key={crop} value={crop}>
              {crop}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="planting-date"
          className="text-sm font-medium text-slate-700"
        >
          Planting Date
        </label>
        <input
          id="planting-date"
          type="date"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={plantingDate}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setPlantingDate(event.target.value)
          }
          required
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="agent"
          className="text-sm font-medium text-slate-700"
        >
          Assign to Agent
        </label>
        <select
          id="agent"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={assignedAgent}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setAssignedAgent(event.target.value)
          }
          required
        >
          <option value="">Select an agent</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.first_name} {agent.last_name} (@{agent.username})
              {agentWorkloadById
                ? ` - ${agentWorkloadById[agent.id] ?? 0} field(s)`
                : ""}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Field"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
