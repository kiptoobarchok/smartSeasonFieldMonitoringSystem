import type { Field } from "@/lib/types";

interface FieldTableProps {
  fields: Field[];
}

export function FieldTable({ fields }: FieldTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-4 py-3">Field</th>
            <th className="px-4 py-3">Crop</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Assigned Agent</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{field.name}</td>
              <td className="px-4 py-3">{field.crop_type}</td>
              <td className="px-4 py-3">{field.current_stage}</td>
              <td className="px-4 py-3">{field.status}</td>
              <td className="px-4 py-3">{field.assigned_agent_name || "—"}</td>
            </tr>
          ))}
          {fields.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                No fields found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
