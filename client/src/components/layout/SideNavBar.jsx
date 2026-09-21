import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Container,
  Activity,
  CloudRain,
  AlertTriangle,
} from "lucide-react";

export function SideNavBar({ unreadAlerts = 0 }) {
  const navItems = [
    {
      name: "Overview Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Tanks & Telemetry",
      path: "/tanks",
      icon: Container,
    },
    {
      name: "Water Quality",
      path: "/quality",
      icon: Activity,
    },
    {
      name: "Yield Analytics",
      path: "/analytics",
      icon: CloudRain,
    },
    {
      name: "Alerts & Maintenance",
      path: "/alerts",
      icon: AlertTriangle,
      badge: unreadAlerts > 0 ? unreadAlerts : null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 min-h-[calc(100vh-4rem)] p-4 text-slate-300">
      <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 px-3">
        Navigation
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sky-600 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-8 pt-4 border-t border-slate-800 px-3">
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-200">
            System Parameters
          </p>
          <div className="mt-2 space-y-1 text-xs text-slate-400">
            <p>
              Catchment Area:{" "}
              <span className="text-slate-200 font-mono">500 m²</span>
            </p>
            <p>
              Runoff Efficiency:{" "}
              <span className="text-slate-200 font-mono">0.90</span>
            </p>
            <p>
              Low Water Threshold:{" "}
              <span className="text-slate-200 font-mono">10%</span>
            </p>
            <p>
              Overflow Threshold:{" "}
              <span className="text-slate-200 font-mono">98%</span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SideNavBar;
