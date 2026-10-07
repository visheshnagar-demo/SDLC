import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ShieldAlert,
  Users,
  Activity,
  HeartPulse,
  ClipboardList,
} from "lucide-react";

export const SidebarNav = () => {
  const { user } = useAuth();
  const role = user?.role || "PATIENT";

  const navItems = [
    {
      to: "/",
      label: "Patient Portal",
      icon: LayoutDashboard,
      badge: "Portal",
      roles: ["PATIENT", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
    },
    {
      to: "/appointments",
      label: "Appointments",
      icon: Calendar,
      badge: "Live",
      roles: ["PATIENT", "DOCTOR", "ADMIN", "RECEPTIONIST", "NURSE"],
    },
    {
      to: "/doctor-ehr",
      label: "Physician EHR",
      icon: HeartPulse,
      badge: "Clinical",
      roles: ["DOCTOR", "ADMIN", "NURSE"],
    },
    {
      to: "/admin",
      label: "Admin & Audit Console",
      icon: ShieldAlert,
      badge: "HIPAA",
      roles: ["ADMIN", "RECEPTIONIST"],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-57px)] flex flex-col justify-between border-r border-slate-800 p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isAllowed = item.roles.includes(role);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-600 text-white font-semibold shadow-sm"
                        : isAllowed
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-400"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Clinical & RBAC Status Widget */}
        <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Hospital Telemetry
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>EHR Sync</span>
              <span className="text-emerald-400 font-mono">ONLINE</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Audit Pipeline</span>
              <span className="text-sky-400 font-mono">ACTIVE</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>HL7 / FHIR Bridge</span>
              <span className="text-emerald-400 font-mono">READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
        <p className="font-medium text-slate-400">MediCare HMS Platform</p>
        <p>HIPAA &amp; HITECH Compliant</p>
      </div>
    </aside>
  );
};

export default SidebarNav;
