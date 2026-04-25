import { ReactNode } from "react";

interface SidebarNavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

interface SidebarProps {
  items: SidebarNavItem[];
  currentPath: string;
}

export function Sidebar({ items, currentPath }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white shadow-sm sm:block">
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <h1 className="text-lg font-bold text-slate-900">SmartSeason</h1>
          <p className="text-xs text-slate-500 mt-1">Field Monitoring</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {items.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge && item.badge > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4">
          <button
            onClick={() => {
              localStorage.removeItem("smartseason_access_token");
              localStorage.removeItem("smartseason_role");
              window.location.href = "/login";
            }}
            className="w-full text-sm text-slate-600 py-2 px-3 rounded-lg hover:bg-slate-100 transition text-left"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
