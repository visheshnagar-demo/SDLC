import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bird,
  Egg,
  Package,
  Activity,
  ShieldCheck,
} from "lucide-react";

export function Sidebar() {
  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Flock Registry",
      path: "/flocks",
      icon: Bird,
    },
    {
      name: "Egg Collections",
      path: "/egg-collections",
      icon: Egg,
    },
    {
      name: "Feed & Inventory",
      path: "/feed-inventory",
      icon: Package,
    },
    {
      name: "Health & Mortality",
      path: "/health-logs",
      icon: Activity,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-emerald-600 text-white p-2 rounded-lg flex items-center justify-center">
          <Bird className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight">
            Hens Central
          </h1>
          <p className="text-xs text-slate-400">Poultry Management System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
              end={item.path === "/"}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Biosecurity & System Status Footer */}
      <div className="p-4 m-4 bg-slate-800/80 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Biosecurity Status: Normal</span>
        </div>
        <p className="text-xs text-slate-400">
          All coops active. Routine vaccinations updated.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
