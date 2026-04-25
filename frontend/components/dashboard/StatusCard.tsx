interface StatusCardProps {
  label: string;
  value: number;
  colorClass: string;
}

export function StatusCard({ label, value, colorClass }: StatusCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}
