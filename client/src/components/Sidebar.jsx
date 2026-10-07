import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BedDouble,
  Users,
  Receipt,
  Hotel,
  ShieldCheck,
} from "lucide-react";

const Sidebar = () => {
  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/rooms", label: "Room Inventory", icon: BedDouble },
    { to: "/guests", label: "Guests & Check-In", icon: Users },
    { to: "/billing", label: "Billing & Folios", icon: Receipt },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Hotel className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
              Grand Horizon
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Hotel Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-slate-200">System Status</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Front Desk Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
