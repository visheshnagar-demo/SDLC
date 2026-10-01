import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  ShieldAlert,
  UserPlus,
  Activity,
  HeartPulse,
} from "lucide-react";

export default function SidebarNav({
  onQuickIntake,
  isCollapsed,
  onToggleCollapse,
}) {
  const location = useLocation();

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Patients",
      path: "/patients",
      icon: Users,
      badge: "MPI",
    },
    {
      name: "Appointments",
      path: "/appointments",
      icon: Calendar,
      badge: "Live",
    },
    {
      name: "Medical Records",
      path: "/emr",
      icon: FileText,
      badge: "EMR",
    },
    {
      name: "Audit Trail",
      path: "/audit-logs",
      icon: ShieldAlert,
      badge: "HIPAA",
    },
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 border-r border-slate-800 shrink-0 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                HealthCare Core
              </span>
              <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
                Hospital OS v2.4
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Quick Intake Emergency CTA */}
      <div className="p-3">
        <button
          onClick={onQuickIntake}
          className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-semibold py-2.5 px-3 rounded-lg shadow-md transition-all ${
            isCollapsed ? "p-2" : ""
          }`}
          title="Quick Patient Registration"
        >
          <UserPlus className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="text-sm">Register Patient</span>}
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sky-600/20 text-sky-400 border border-sky-500/30"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
              title={item.name}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? "text-sky-400" : "text-slate-400"
                  }`}
                />
                {!isCollapsed && <span>{item.name}</span>}
              </div>
              {!isCollapsed && item.badge && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Shift & Department Indicator */}
      {!isCollapsed && (
        <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Shift: Day Roster Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Emergency & Inpatient Units Online
          </p>
        </div>
      )}

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={onToggleCollapse}
          className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition flex items-center gap-2 w-full justify-center"
        >
          <Activity className="h-4 w-4" />
          {!isCollapsed && (
            <span>{isCollapsed ? "Expand" : "Collapse Sidebar"}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
