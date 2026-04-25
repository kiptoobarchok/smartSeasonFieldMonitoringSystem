interface AnalyticsMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  color: string;
}

interface AnalyticsOverviewProps {
  metrics: AnalyticsMetric[];
}

export function AnalyticsOverview({ metrics }: AnalyticsOverviewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Global Analytics</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <p className="text-sm text-slate-600">{metric.label}</p>
            <p className={`mt-2 text-3xl font-bold ${metric.color}`}>
              {metric.value}
            </p>
            {metric.trend && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                <span
                  className={`inline-block ${
                    metric.trend === "up"
                      ? "text-green-600"
                      : metric.trend === "down"
                        ? "text-red-600"
                        : "text-slate-600"
                  }`}
                >
                  {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→"}
                </span>
                <span className="text-slate-600">{metric.trendValue}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
