import type { FieldUpdate } from "@/lib/types";

interface RecentUpdatesProps {
  updates: FieldUpdate[];
}

export function RecentUpdates({ updates }: RecentUpdatesProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-slate-800">Recent Updates</h3>
      <ul className="space-y-3">
        {updates.map((update) => (
          <li key={update.id} className="rounded-lg border border-slate-100 p-3">
            <p className="text-sm font-medium text-slate-800">{update.stage}</p>
            <p className="text-xs text-slate-500">By {update.agent_name}</p>
            {update.notes && <p className="mt-1 text-sm text-slate-700">{update.notes}</p>}
          </li>
        ))}
        {updates.length === 0 && <li className="text-sm text-slate-500">No updates yet.</li>}
      </ul>
    </div>
  );
}
