import { ReactNode } from "react";

type AlertLevel = "info" | "warning" | "critical";

interface PriorityAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: string;
  action?: {
    label: string;
    href: string;
  };
}

interface PriorityNotificationsProps {
  alerts: PriorityAlert[];
}

const iconMap: Record<AlertLevel, ReactNode> = {
  info: (
    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  critical: (
    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 110 6c2.08.352 3.83 1.884 4.667 3.804.447.815.023 1.802-.693 2.188-.693.387-1.655.395-2.077-.124-.329-.378-.715-.884-.967-1.402C1.347 10.5 6.05 15.97 13.477 14.89z" clipRule="evenodd" />
    </svg>
  ),
};

export function PriorityNotifications({ alerts }: PriorityNotificationsProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Priority Alerts</h3>
        <p className="text-sm text-slate-500">All systems operating normally.</p>
      </div>
    );
  }

  const sortedAlerts = alerts.sort((a, b) => {
    const levelOrder: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">Priority Alerts</h3>
      {sortedAlerts.map((alert) => {
        const bgColor = {
          critical: "bg-red-50 border-red-200",
          warning: "bg-amber-50 border-amber-200",
          info: "bg-blue-50 border-blue-200",
        }[alert.level];

        const textColor = {
          critical: "text-red-800",
          warning: "text-amber-800",
          info: "text-blue-800",
        }[alert.level];

        return (
          <div
            key={alert.id}
            className={`rounded-lg border ${bgColor} ${textColor} p-3 text-sm`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{iconMap[alert.level]}</div>
              <div className="flex-1">
                <p className="font-medium">{alert.title}</p>
                <p className="text-xs opacity-80 mt-1">{alert.message}</p>
                <p className="text-xs opacity-60 mt-2">{alert.timestamp}</p>
                {alert.action && (
                  <a
                    href={alert.action.href}
                    className="inline-block mt-2 text-xs font-semibold underline hover:opacity-80"
                  >
                    {alert.action.label} →
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
